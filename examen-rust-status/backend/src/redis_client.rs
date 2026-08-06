//! Een minimale Redis client.
//!
//! Redis gebruikt een heel eenvoudig tekstprotocol (RESP). We implementeren
//! hier enkel wat deze applicatie nodig heeft, zodat we geen zware externe
//! dependencies nodig hebben.
//!
//! Je hoeft dit bestand NIET te begrijpen om de oefening op te lossen.

use std::io::{BufRead, BufReader, Read, Write};
use std::net::TcpStream;

/// Een antwoord van de Redis server.
#[derive(Debug)]
pub enum Reply {
    Simple(String),
    Int(i64),
    Bulk(Option<String>),
    Array(Vec<Reply>),
}

pub struct RedisClient {
    reader: BufReader<TcpStream>,
    writer: TcpStream,
}

impl RedisClient {
    /// Maakt een verbinding met de Redis server.
    pub fn connect(host: &str, port: u16) -> std::io::Result<Self> {
        let stream = TcpStream::connect((host, port))?;
        let reader = BufReader::new(stream.try_clone()?);
        Ok(RedisClient {
            reader,
            writer: stream,
        })
    }

    /// Stuurt een commando en leest het antwoord.
    ///
    /// Commando's worden verstuurd als een "array of bulk strings":
    ///   *2\r\n$3\r\nGET\r\n$3\r\nkey\r\n
    pub fn command(&mut self, args: &[&str]) -> std::io::Result<Reply> {
        let mut out = format!("*{}\r\n", args.len());
        for arg in args {
            out.push_str(&format!("${}\r\n{}\r\n", arg.len(), arg));
        }

        self.writer.write_all(out.as_bytes())?;
        self.writer.flush()?;

        self.read_reply()
    }

    fn read_reply(&mut self) -> std::io::Result<Reply> {
        let mut line = String::new();
        self.reader.read_line(&mut line)?;

        let line = line.trim_end_matches(['\r', '\n']).to_string();
        if line.is_empty() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::UnexpectedEof,
                "lege reply van Redis",
            ));
        }

        let (kind, rest) = line.split_at(1);

        match kind {
            // +OK
            "+" => Ok(Reply::Simple(rest.to_string())),

            // -ERR iets ging fout
            "-" => Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                rest.to_string(),
            )),

            // :42
            ":" => Ok(Reply::Int(rest.parse().unwrap_or(0))),

            // $5\r\nhello   (of $-1 voor "bestaat niet")
            "$" => {
                let len: i64 = rest.parse().unwrap_or(-1);
                if len < 0 {
                    return Ok(Reply::Bulk(None));
                }

                // len bytes + 2 bytes voor de afsluitende \r\n
                let mut buf = vec![0u8; len as usize + 2];
                self.reader.read_exact(&mut buf)?;
                buf.truncate(len as usize);

                Ok(Reply::Bulk(Some(String::from_utf8_lossy(&buf).to_string())))
            }

            // *2\r\n...  een array met 2 elementen
            "*" => {
                let count: i64 = rest.parse().unwrap_or(0);
                let mut items = Vec::new();
                for _ in 0..count.max(0) {
                    items.push(self.read_reply()?);
                }
                Ok(Reply::Array(items))
            }

            _ => Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("onbekend RESP type: {}", kind),
            )),
        }
    }
}

impl Reply {
    /// Haalt een geheel getal uit het antwoord.
    pub fn as_int(&self) -> i64 {
        match self {
            Reply::Int(i) => *i,
            Reply::Bulk(Some(s)) => s.parse().unwrap_or(0),
            _ => 0,
        }
    }

    /// Zet een array-antwoord om naar een lijst van strings.
    pub fn as_strings(&self) -> Vec<String> {
        match self {
            Reply::Array(items) => items
                .iter()
                .filter_map(|i| match i {
                    Reply::Bulk(Some(s)) => Some(s.clone()),
                    Reply::Simple(s) => Some(s.clone()),
                    _ => None,
                })
                .collect(),
            _ => Vec::new(),
        }
    }
}

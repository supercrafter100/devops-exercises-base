//! Meridian Freight - Zendingen statusbord
//!
//! Regels:
//!   - Alle routes draaien onder /api
//!   - STORAGE bepaalt de opslag: memory (default) | redis
//!   - Bij redis wordt verbonden via REDIS_HOST en REDIS_PORT
//!   - De API luistert op poort 4000
//!
//! Deze applicatie is bewust klein en leesbaar gehouden.
//! Je hoeft de Rust code NIET aan te passen om deze oefening op te lossen.

mod redis_client;

use std::env;
use std::sync::Mutex;

use redis_client::RedisClient;
use serde_json::json;
use tiny_http::{Header, Method, Response, Server};

/// Poort waarop de API luistert.
const PORT: u16 = 4000;

/// Een zending in het systeem.
#[derive(Clone)]
struct Shipment {
    id: u32,
    tracking: String,
    destination: String,
    status: String,
}

impl Shipment {
    fn to_json(&self) -> serde_json::Value {
        json!({
            "id": self.id,
            "tracking": self.tracking,
            "destination": self.destination,
            "status": self.status,
        })
    }
}

/// De opslaglaag. Er zijn twee varianten: in-memory en Redis.
enum Storage {
    Memory(Mutex<MemoryStore>),
    Redis(Mutex<RedisClient>),
}

struct MemoryStore {
    shipments: Vec<Shipment>,
    next_id: u32,
}

impl Storage {
    fn type_name(&self) -> &'static str {
        match self {
            Storage::Memory(_) => "memory",
            Storage::Redis(_) => "redis",
        }
    }

    fn list(&self) -> Vec<Shipment> {
        match self {
            Storage::Memory(store) => {
                let store = store.lock().unwrap();
                store.shipments.clone()
            }
            Storage::Redis(client) => {
                let mut client = client.lock().unwrap();

                // Alle zendingen staan in een Redis hash "shipments",
                // met het id als veld en JSON als waarde. HGETALL geeft
                // afwisselend een veldnaam en een waarde terug.
                let reply = match client.command(&["HGETALL", "shipments"]) {
                    Ok(r) => r,
                    Err(e) => {
                        eprintln!("Redis fout bij ophalen: {}", e);
                        return Vec::new();
                    }
                };

                let flat = reply.as_strings();

                let mut out: Vec<Shipment> = flat
                    .chunks(2)
                    .filter_map(|pair| pair.get(1))
                    .filter_map(|raw| serde_json::from_str::<serde_json::Value>(raw).ok())
                    .map(|v| Shipment {
                        id: v["id"].as_u64().unwrap_or(0) as u32,
                        tracking: v["tracking"].as_str().unwrap_or("").to_string(),
                        destination: v["destination"].as_str().unwrap_or("").to_string(),
                        status: v["status"].as_str().unwrap_or("").to_string(),
                    })
                    .collect();

                out.sort_by_key(|s| s.id);
                out
            }
        }
    }

    fn add(&self, tracking: String, destination: String, status: String) -> Shipment {
        match self {
            Storage::Memory(store) => {
                let mut store = store.lock().unwrap();
                let shipment = Shipment {
                    id: store.next_id,
                    tracking,
                    destination,
                    status,
                };
                store.next_id += 1;
                store.shipments.push(shipment.clone());
                shipment
            }
            Storage::Redis(client) => {
                let mut client = client.lock().unwrap();

                // INCR geeft ons een uniek, oplopend id.
                let id = client
                    .command(&["INCR", "shipment:next_id"])
                    .map(|r| r.as_int() as u32)
                    .unwrap_or(1);

                let shipment = Shipment {
                    id,
                    tracking,
                    destination,
                    status,
                };

                if let Err(e) = client.command(&[
                    "HSET",
                    "shipments",
                    &id.to_string(),
                    &shipment.to_json().to_string(),
                ]) {
                    eprintln!("Redis fout bij toevoegen: {}", e);
                }

                shipment
            }
        }
    }

    fn delete(&self, id: u32) {
        match self {
            Storage::Memory(store) => {
                let mut store = store.lock().unwrap();
                store.shipments.retain(|s| s.id != id);
            }
            Storage::Redis(client) => {
                let mut client = client.lock().unwrap();
                if let Err(e) = client.command(&["HDEL", "shipments", &id.to_string()]) {
                    eprintln!("Redis fout bij verwijderen: {}", e);
                }
            }
        }
    }
}

fn env_or(key: &str, fallback: &str) -> String {
    match env::var(key) {
        Ok(v) if !v.is_empty() => v,
        _ => fallback.to_string(),
    }
}

/// Bouwt een JSON response met de juiste Content-Type header.
fn json_response(status: u16, body: serde_json::Value) -> Response<std::io::Cursor<Vec<u8>>> {
    let header = Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap();
    Response::from_string(body.to_string())
        .with_status_code(status)
        .with_header(header)
}

fn main() {
    let mode = env_or("STORAGE", "memory").to_lowercase();

    let storage = if mode == "redis" {
        let host = env_or("REDIS_HOST", "127.0.0.1");
        let port: u16 = env_or("REDIS_PORT", "6379").parse().unwrap_or(6379);

        // De database heeft bij het opstarten even tijd nodig. We proberen
        // daarom een aantal keer opnieuw te verbinden voor we opgeven.
        let mut connection = None;
        for _ in 0..30 {
            match RedisClient::connect(&host, port) {
                Ok(conn) => {
                    connection = Some(conn);
                    break;
                }
                Err(e) => {
                    eprintln!("Wachten op Redis... ({})", e);
                    std::thread::sleep(std::time::Duration::from_secs(2));
                }
            }
        }

        match connection {
            Some(conn) => {
                println!("Verbonden met Redis");
                Storage::Redis(Mutex::new(conn))
            }
            None => {
                eprintln!("Kon niet verbinden met Redis");
                std::process::exit(1);
            }
        }
    } else {
        Storage::Memory(Mutex::new(MemoryStore {
            shipments: Vec::new(),
            next_id: 1,
        }))
    };

    let addr = format!("0.0.0.0:{}", PORT);
    let server = Server::http(&addr).expect("Kon de server niet starten");

    println!("Status API luistert op http://localhost:{}", PORT);
    println!("Opslag: {}", storage.type_name());

    for mut request in server.incoming_requests() {
        // Het pad zonder querystring, bv. "/api/shipments"
        let url = request.url().split('?').next().unwrap_or("/").to_string();
        let method = request.method().clone();

        let response = match (&method, url.as_str()) {
            // GET /api/verify -> welke opslag is in gebruik?
            (Method::Get, "/api/verify") => {
                json_response(200, json!({ "storage": storage.type_name() }))
            }

            // GET /api/shipments -> lijst van zendingen
            (Method::Get, "/api/shipments") => {
                let list: Vec<serde_json::Value> =
                    storage.list().iter().map(|s| s.to_json()).collect();
                json_response(200, serde_json::Value::Array(list))
            }

            // POST /api/shipments -> zending toevoegen
            (Method::Post, "/api/shipments") => {
                let mut body = String::new();
                if request.as_reader().read_to_string(&mut body).is_err() {
                    json_response(400, json!({ "error": "kon body niet lezen" }))
                } else {
                    match serde_json::from_str::<serde_json::Value>(&body) {
                        Ok(v) => {
                            let tracking =
                                v["tracking"].as_str().unwrap_or("").trim().to_string();
                            let destination =
                                v["destination"].as_str().unwrap_or("").trim().to_string();
                            let status = {
                                let s = v["status"].as_str().unwrap_or("").trim();
                                if s.is_empty() { "onderweg".to_string() } else { s.to_string() }
                            };

                            if tracking.is_empty() || destination.is_empty() {
                                json_response(
                                    400,
                                    json!({ "error": "tracking en destination zijn verplicht" }),
                                )
                            } else {
                                let created = storage.add(tracking, destination, status);
                                json_response(201, created.to_json())
                            }
                        }
                        Err(_) => json_response(400, json!({ "error": "ongeldige JSON" })),
                    }
                }
            }

            // DELETE /api/shipments/{id} -> zending verwijderen
            (Method::Delete, path) if path.starts_with("/api/shipments/") => {
                let id_str = path.trim_start_matches("/api/shipments/");
                match id_str.parse::<u32>() {
                    Ok(id) => {
                        storage.delete(id);
                        json_response(200, json!({ "deleted": true }))
                    }
                    Err(_) => json_response(400, json!({ "error": "ongeldig id" })),
                }
            }

            _ => json_response(404, json!({ "error": "onbekend endpoint" })),
        };

        let _ = request.respond(response);
    }
}

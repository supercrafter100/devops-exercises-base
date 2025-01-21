CREATE table blogs (
    id text primary key,
    title varchar(255),
    content text
);

INSERT INTO blogs (id, title, content) VALUES ('a', 'Eerste blog met PostgreSQL!', 'Je hebt nu je eerste blog met PostgreSQL aangemaakt!');
INSERT INTO blogs (id, title, content) VALUES ('b', 'Super coole veggie info', 'Vandaag heb ik een super coole blog geschreven over vegetarisch eten!');
INSERT INTO blogs (id, title, content) VALUES ('c', 'Mijn eerste blog', 'Dit is mijn eerste blog ooit!');
INSERT INTO blogs (id, title, content) VALUES ('d', 'Wat ik vanavond ga eten', 'Ik ga vanavond lekker koken, ik heb er zin in!');

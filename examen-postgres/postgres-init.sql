CREATE table blogs (
    id serial primary key,
    title varchar(255),
    content text,
);

INSERT INTO blogs (title, content) VALUES ('Eerste blog met PostgreSQL!', 'Je hebt nu je eerste blog met PostgreSQL aangemaakt!');
INSERT INTO blogs (title, content) VALUES ('Super coole veggie info', 'Vandaag heb ik een super coole blog geschreven over vegetarisch eten!');
INSERT INTO blogs (title, content) VALUES ('Mijn eerste blog', 'Dit is mijn eerste blog ooit!');
INSERT INTO blogs (title, content) VALUES ('Wat ik vanavond ga eten', 'Ik ga vanavond lekker koken, ik heb er zin in!');

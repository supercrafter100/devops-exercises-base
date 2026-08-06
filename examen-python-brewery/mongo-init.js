// Solstice Brewing Co.
// Dit script wordt automatisch uitgevoerd bij het opstarten van MongoDB.
// Het maakt de database, een gebruiker en enkele brouwsels aan.

db = db.getSiblingDB('brewery');

db.createUser({
    user: 'brewery',
    pwd: 'SolsticeBrouwt2026!',
    roles: [{ role: 'readWrite', db: 'brewery' }],
});

db.batches.insertMany([
    {
        id: 1,
        name: 'Zonnewende Tripel',
        style: 'Tripel',
        volume_l: 800,
        stage: 'gisting',
    },
    {
        id: 2,
        name: 'Middernachtstout',
        style: 'Imperial Stout',
        volume_l: 400,
        stage: 'lagering',
    },
    {
        id: 3,
        name: 'Hooiland Saison',
        style: 'Saison',
        volume_l: 600,
        stage: 'koken',
    },
    {
        id: 4,
        name: 'Kade 7 Pils',
        style: 'Pilsner',
        volume_l: 1200,
        stage: 'afgevuld',
    },
]);

// De teller moet meelopen met de bestaande ids, anders krijgt een nieuwe
// batch een id dat al bestaat.
db.counters.insertOne({ _id: 'batch_id', seq: 4 });

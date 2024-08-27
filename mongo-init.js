db = new Mongo().getDB('examen');
db.createUser(
        {
            user: "examen",
            pwd: "examenwachtwoord",
            roles: [
                {
                    role: "readWrite",
                    db: "examen"
                }
            ]
        }
);



db.createCollection('Todos', { capped: false });

db.Todos.insert([
    {id: '1', title: 'mijn eerste taak in MongoDB', status: 'TODO'}
])

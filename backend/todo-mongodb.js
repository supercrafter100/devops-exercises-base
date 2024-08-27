const {v4} = require('uuid');

const { MongoClient }    = require('mongodb');
const uri = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PWD}@${process.env.MONGODB_HOST}:27017/${process.env.MONGODB_DB}`;


async function getTodos(req, res) {
    console.log('getting todos');
    console.log('mongodb uri', uri);
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('client connected');
        const todos = await client.db().collection('Todos').find().toArray();
        return res.json(todos);
    } catch(err) {
        console.error(err);
        return res.status(500);
    } finally {
        await client.close();
    }
}

async function addTodo(req, res) {
    const {title} = req.body;
    const todo = {
        id: v4(),
        title,
        status: 'TODO',
    }
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const todos = client.db().collection('Todos');
        await todos.insertOne(todo);
        return res.json('ok');
    } catch(err) {
        console.error(err);
        return res.status(500);
    } finally {
        await client.close();
    }    
}

async function updateTodo(req, res) {
    const {status} = req.body;
    const {id} = req.params;
    const client = new MongoClient(uri);
        
    try {
        await client.connect();
        const todos = client.db().collection('Todos');

        const filter = { id };
        const updateDoc = {
            $set: {
              status
            },
          };
        await todos.updateOne(filter, updateDoc);
        return res.json('ok');
    } catch(err) {
        console.error(err);
        return res.status(500);
    } finally {
        await client.close();
    }    
}

async function deleteTodo(req, res) {
    const {id} = req.params;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const todos = client.db().collection('Todos');

        const query = { id };
        
        await todos.deleteOne(query);
        return res.json('ok');
    } catch(err) {
        console.error(err);
        return res.status(500);
    } finally {
        await client.close();
    }   
}

async function verify() {
    const client = new MongoClient(uri);
        
    try {
        await client.connect();
        const todos = await client.db().collection('Todos').find().toArray();

        return {status: 'ok'}
    }
    catch(err) {
        return {status: 'not ok', error: err};
    }
    finally {
        client.close();
    }
    
}

module.exports =  {
    getTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    verify,
}
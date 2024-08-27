const mongodb = require('./todo-mongodb');

async function verify(req, res) {
    const result = {};
    result.storage = process.env.STORAGE || 'in-memory';
    if (result.storage === 'mongodb') {
        result.mongodb = await mongodb.verify();
    }
    return res.json(result);
}

module.exports =  {
    verify,
}

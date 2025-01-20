async function verify(req, res) {
    const result = {};
    result.storage = process.env.STORAGE || 'in-memory';
    return res.json(result);
}

module.exports = {
    verify,
};

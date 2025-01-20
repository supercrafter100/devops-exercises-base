const { v4 } = require('uuid');
const postgres = require('postgres');
const uri = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PWD}@${process.env.POSTGERS_HOST}:5432/${process.env.POSTGRES_DB}`;
const sql = postgres(uri);

async function getBlogs(req, res) {
    console.log('getting blogs');
    console.log('postgres uri', uri);
    const blogs = await sql`select * from blogs`;
    return res.json(blogs);
}

async function addBlog(req, res) {
    const { title, content } = req.body;
    await sql`insert into blogs (id, title, content) values (${v4()}, ${title}, ${content})`;
    return res.json('ok');
}

async function updateBlog(req, res) {
    const { title, content } = req.body;
    const { id } = req.params;

    await sql`update blogs set title = ${title}, content = ${content} where id = ${id}`;
    return res.json('ok');
}

async function deleteBlog(req, res) {
    const { id } = req.params;

    await sql`delete from blogs where id = ${id}`;
    return res.json('ok');
}

module.exports = {
    getBlogs,
    addBlog,
    updateBlog,
    deleteBlog,
};

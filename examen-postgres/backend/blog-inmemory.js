const blogs = [];
const { v4 } = require('uuid');

blogs.push({
    id: v4(),
    title: 'mijn eerste blog',
    content: 'dit is mijn eerste blog',
});
blogs.push({
    id: v4(),
    title: 'mijn tweede blog',
    content: 'dit is mijn tweede blog',
});
blogs.push({
    id: v4(),
    title: 'mijn derde blog',
    content: 'dit is mijn derde blog',
});

async function getBlogs(req, res) {
    return res.json(blogs);
}

async function addBlog(req, res) {
    const { title, content } = req.body;
    blogs.push({ id: v4(), title, content });
    return res.json('ok');
}

async function updateBlog(req, res) {
    const { title, content } = req.body;
    const { id } = req.params;

    const blog = blogs.find((x) => x.id === id);
    if (blog) {
        blog.title = title;
        blog.content = content;
    }
    return res.json('ok');
}

async function deleteBlog(req, res) {
    const { id } = req.params;

    const blogIndex = blogs.findIndex((x) => x.id === id);
    if (blogIndex !== -1) {
        blogs.splice(blogIndex, 1);
    }
    return res.json('ok');
}

module.exports = {
    getBlogs,
    addBlog,
    updateBlog,
    deleteBlog,
};

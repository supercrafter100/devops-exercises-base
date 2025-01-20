const express = require('express');
const app = express();
const port = 4000;

const API_URL = process.env.API_URL || 'http://localhost:8000';

app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
    // Fetch blogs
    const blogs = await fetch(`${API_URL}/api/blogs`).then((res) => res.json());
    res.render('index', { blogs });
});

app.get('/blog/:id', async (req, res) => {
    // Fetch blog
    const blogs = await fetch(`${API_URL}/api/blogs`).then((res) => res.json());
    const blog = blogs.find((blog) => blog.id === req.params.id);
    if (!blog) {
        return res.redirect('/');
    }

    res.render('blog', { blog });
});

app.listen(port, () => {
    console.log(`Frontend listening on port ${port}`);
});

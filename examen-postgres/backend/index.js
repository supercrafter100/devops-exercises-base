const express = require('express');
const app = express();
const port = 8000;
const verify = require('./verify');

const usePostgres = process.env.STORAGE && process.env.STORAGE === 'postgres';
const blog = usePostgres
    ? require('./blog-postgres')
    : require('./blog-inmemory');

app.use(express.json());

app.use((req, res, next) => {
    console.log(req.method + ' ' + req.url);
    next();
});

app.get('/api/blogs', blog.getBlogs);
app.post('/api/blogs', blog.addBlog);
app.put('/api/blogs/:id', blog.updateBlog);
app.delete('/api/blogs/:id', blog.deleteBlog);

app.get('/api/verify', verify.verify);

app.listen(port, () => {
    console.log(`Blog api listening on port ${port}`);
});

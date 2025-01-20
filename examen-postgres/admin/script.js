document.body.onload = async function () {
    const blogs = await getBlogs();
    const blogsList = document.getElementById('blogs');

    const blogsHtml = blogs
        .map((blog) => {
            return `
                <div class="col-4">
                    <div class="card mt-3">
                        <div class="card-body">
                            <h5 class="card-title">${blog.title}</h5>
                            <p class="card-text">
                                ${blog.content}
                            </p>
                            <button
                                class="btn btn-danger"
                                onclick="deleteBlog('${blog.id}')"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
        `;
        })
        .join('');

    blogsList.innerHTML = blogsHtml;
};

async function deleteBlog(id) {
    const response = await fetch(`/api/blogs/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
}

async function getBlogs() {
    const response = await fetch('/api/blogs');
    return await response.json();
}

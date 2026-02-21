const blogGrid = document.getElementById('blog-grid');

async function loadBlogPosts() {
  try {
    const response = await fetch('/api/blog');
    const data = await response.json();
    renderBlogPosts(data?.posts || []);
  } catch (error) {
    console.error('Failed to load blog posts', error);
    blogGrid.innerHTML = '<p class="form-status">Unable to load blog posts. Please refresh.</p>';
  }
}

function renderBlogPosts(posts) {
  if (!posts.length) {
    blogGrid.innerHTML = '<p>No blog posts found. Check back soon.</p>';
    return;
  }

  blogGrid.innerHTML = posts
    .map(
      (post) => `
        <a href="/blog-post?id=${post._id}" class="blog-card">
          <div class="blog-card__meta">
            <time>${post.date}</time>
            <span>${post.author}</span>
          </div>
          <h3>${post.title}</h3>
          <p class="blog-card__excerpt">${post.excerpt}</p>
          ${post.tags && post.tags.length ? `
            <div class="blog-card__tags">
              ${post.tags.map((tag) => `<span class="blog-card__tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </a>
      `,
    )
    .join('');
}

loadBlogPosts();


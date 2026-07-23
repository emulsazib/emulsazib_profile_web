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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : text;
  return div.innerHTML;
}

function renderBlogPosts(posts) {
  if (!posts.length) {
    blogGrid.innerHTML = '<p>No blog posts found. Check back soon.</p>';
    return;
  }

  blogGrid.innerHTML = posts
    .map((post) => {
      // Prefer clean slug URLs; fall back to the legacy id-based link.
      const href = post.slug
        ? `/blog-post?slug=${encodeURIComponent(post.slug)}`
        : `/blog-post?id=${encodeURIComponent(post._id)}`;
      const thumb = post.featuredImage
        ? `<div class="blog-card__thumb"><img src="${escapeHtml(post.featuredImage)}" alt="${escapeHtml(post.title)}" loading="lazy" /></div>`
        : '';
      const tags = post.tags && post.tags.length
        ? `<div class="blog-card__tags">${post.tags.map((tag) => `<span class="blog-card__tag">${escapeHtml(tag)}</span>`).join('')}</div>`
        : '';
      return `
        <a href="${href}" class="blog-card">
          ${thumb}
          <div class="blog-card__meta">
            <time>${escapeHtml(post.date)}</time>
            <span>${escapeHtml(post.author)}</span>
          </div>
          <h3>${escapeHtml(post.title)}</h3>
          <p class="blog-card__excerpt">${escapeHtml(post.excerpt)}</p>
          ${tags}
        </a>
      `;
    })
    .join('');
}

loadBlogPosts();


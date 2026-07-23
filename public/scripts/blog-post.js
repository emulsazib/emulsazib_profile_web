const blogPostTitle = document.getElementById('blog-post-title');
const blogPostBody = document.getElementById('blog-post-body');
const blogDate = document.getElementById('blog-date');
const blogAuthor = document.getElementById('blog-author');
const blogTitleMeta = document.getElementById('blog-title');
const blogFeatured = document.getElementById('blog-featured-image');

async function loadBlogPost() {
  const urlParams = new URLSearchParams(window.location.search);
  // Accept either ?slug=… (preferred) or the legacy ?id=<uuid>.
  const postKey = urlParams.get('slug') || urlParams.get('id');

  if (!postKey) {
    window.location.href = '/blog';
    return;
  }

  try {
    const response = await fetch(`/api/blog/${encodeURIComponent(postKey)}`);
    if (!response.ok) {
      throw new Error('Post not found');
    }
    const post = await response.json();
    renderBlogPost(post);
  } catch (error) {
    console.error('Failed to load blog post', error);
    blogPostBody.innerHTML = '<p class="form-status">Unable to load blog post. <a href="/blog">Back to blog</a></p>';
  }
}

// Set the document <title> and meta description for SEO.
function applyMeta(post) {
  const pageTitle = post.metaTitle || post.title;
  blogTitleMeta.textContent = `${pageTitle} - Blog`;

  const description = post.metaDescription || post.excerpt || '';
  let metaEl = document.querySelector('meta[name="description"]');
  if (!metaEl) {
    metaEl = document.createElement('meta');
    metaEl.setAttribute('name', 'description');
    document.head.appendChild(metaEl);
  }
  if (description) metaEl.setAttribute('content', description);
}

function renderBlogPost(post) {
  applyMeta(post);
  blogPostTitle.textContent = post.title;
  blogDate.textContent = post.date || '';
  blogAuthor.textContent = post.author || '';

  if (post.featuredImage) {
    blogFeatured.src = post.featuredImage;
    blogFeatured.alt = post.title || '';
    blogFeatured.hidden = false;
  }

  // HTML posts (from the WordPress-style editor) render sanitized HTML directly;
  // legacy Markdown-ish posts fall back to the client-side formatter.
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(post.content || '');
  if (post.contentFormat === 'html' || (post.contentFormat == null && looksLikeHtml)) {
    const clean = (typeof DOMPurify !== 'undefined')
      ? DOMPurify.sanitize(post.content, { ADD_ATTR: ['target', 'rel'] })
      : post.content;
    blogPostBody.innerHTML = clean;
  } else {
    blogPostBody.innerHTML = formatBlogContent(post.content);
  }
}

function formatBlogContent(content) {
  if (!content) return '<p>No content available.</p>';
  
  let html = '';
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockLanguage = '';
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Handle code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        html += `<pre><code${codeBlockLanguage ? ` class="language-${codeBlockLanguage}"` : ''}>${escapeHtml(codeBlockContent)}</code></pre>`;
        codeBlockContent = '';
        codeBlockLanguage = '';
        inCodeBlock = false;
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLanguage = trimmed.substring(3).trim() || '';
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      continue;
    }
    
    // Headers
    if (trimmed.startsWith('# ')) {
      html += `<h1>${escapeHtml(trimmed.substring(2))}</h1>`;
    } else if (trimmed.startsWith('## ')) {
      html += `<h2>${escapeHtml(trimmed.substring(3))}</h2>`;
    } else if (trimmed.startsWith('### ')) {
      html += `<h3>${escapeHtml(trimmed.substring(4))}</h3>`;
    } else if (trimmed.startsWith('#### ')) {
      html += `<h4>${escapeHtml(trimmed.substring(5))}</h4>`;
    }
    // Images
    else if (line.match(/!\[.*\]\((.*)\)/)) {
      const match = line.match(/!\[(.*)\]\((.*)\)/);
      html += `<img src="${escapeHtml(match[2])}" alt="${escapeHtml(match[1] || '')}">`;
    }
    // Regular paragraphs with formatting
    else if (trimmed) {
      // Process links first - extract and create HTML
      const linkMatches = [];
      let linkIndex = 0;
      let processedLine = trimmed;
      
      // Find all links and replace with placeholders
      processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        const placeholder = `___LINK${linkIndex}___`;
        linkMatches.push({
          placeholder,
          html: `<a href="${escapeHtml(url)}">${escapeHtml(text)}</a>`
        });
        linkIndex++;
        return placeholder;
      });
      
      // Escape HTML (placeholders survive since they don't contain special chars)
      processedLine = escapeHtml(processedLine);
      
      // Restore links
      linkMatches.forEach(({ placeholder, html }) => {
        processedLine = processedLine.replace(placeholder, html);
      });
      
      // Apply bold and italic formatting (escaped text)
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processedLine = processedLine.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      
      html += `<p>${processedLine}</p>`;
    } else {
      html += '<br>';
    }
  }
  
  // Close any open code block
  if (inCodeBlock && codeBlockContent) {
    html += `<pre><code${codeBlockLanguage ? ` class="language-${codeBlockLanguage}"` : ''}>${escapeHtml(codeBlockContent)}</code></pre>`;
  }
  
  return html || '<p>No content available.</p>';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

loadBlogPost();


require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./backend/models/Project');
const Achievement = require('./backend/models/Achievement');
const BlogPost = require('./backend/models/BlogPost');
const Admin = require('./backend/models/Admin');

const projects = [
  {
    title: 'Realtime Collaboration Suite',
    stack: ['TypeScript', 'React', 'WebSockets'],
    description:
      'Designed collaborative whiteboarding with presence indicators, optimistic updates, and end-to-end encryption.',
    link: 'https://example.com/collab',
    github: 'https://github.com/emulsazib/collab-suite',
  },
  {
    title: 'Data Storytelling Platform',
    stack: ['Next.js', 'D3', 'Node.js'],
    description:
      'Built interactive narratives for climate-tech startups, turning raw telemetry into digestible dashboards.',
    link: 'https://example.com/story',
    github: 'https://github.com/emulsazib/data-story',
  },
  {
    title: 'Creator Commerce Engine',
    stack: ['Express', 'MongoDB', 'Stripe'],
    description:
      'Shipped checkout flows, subscription tiers, and analytics for indie creators serving 20k+ monthly customers.',
    link: 'https://example.com/commerce',
    github: 'https://github.com/emulsazib/commerce-engine',
  },
  {
    title: 'Portfolio Demo Website',
    stack: ['Express', 'Node.js', 'Vanilla JS'],
    description:
      'Modern full-stack portfolio website with multi-page navigation, dark mode, and API-driven content.',
    github: 'https://github.com/emulsazib/PortfolioDemoWeb',
  },
];

const achievements = [
  {
    title: 'Hackathon Winner 2024',
    description: 'Won first place in the regional coding hackathon with a real-time collaboration tool.',
    image: '/images/Cover.jpg',
    date: 'March 2024',
  },
  {
    title: 'Open Source Contributor',
    description: 'Contributed to major open-source projects with 1000+ stars on GitHub.',
    image: '/images/rightabout.jpg',
    date: '2023',
  },
  {
    title: 'Tech Conference Speaker',
    description: 'Presented at Web Dev Summit 2024 on modern full-stack architecture.',
    image: '/images/profile.jpg',
    date: 'May 2024',
  },
  {
    title: 'Published Developer',
    description: 'Authored technical articles and tutorials with 50k+ reads across platforms.',
    image: '/images/Cover.jpg',
    date: '2023-2024',
  },
];

const blogPosts = [
  {
    title: 'Building Modern Full-Stack Applications',
    excerpt: 'A comprehensive guide to building scalable, maintainable full-stack applications using modern technologies.',
    content: `# Building Modern Full-Stack Applications

Building modern full-stack applications requires a deep understanding of both frontend and backend technologies. In this post, I'll share my insights on creating scalable and maintainable applications.

## Getting Started

The first step in building a modern application is choosing the right technology stack. Consider factors like:

- Team expertise
- Project requirements
- Scalability needs
- Time constraints

## Architecture Patterns

Modern applications often follow certain architectural patterns that help with maintainability and scalability.

### Microservices vs Monolith

Choosing between microservices and monolithic architecture depends on your specific use case. Microservices offer better scalability but come with added complexity.

## Best Practices

1. **Code Quality**: Maintain clean, readable code
2. **Testing**: Write comprehensive tests
3. **Documentation**: Keep documentation up to date
4. **Performance**: Optimize for speed and efficiency

![Code Example](/images/profile.jpg)

## Conclusion

Building modern applications is an ongoing journey. Stay updated with the latest technologies and best practices.`,
    author: 'Emul Sajib',
    date: 'January 15, 2024',
    tags: ['Full Stack', 'Development', 'Architecture'],
  },
  {
    title: 'The Power of Express.js and Node.js',
    excerpt: 'Exploring why Express.js and Node.js have become the go-to choices for building fast and scalable backend services.',
    content: `# The Power of Express.js and Node.js

Express.js has revolutionized backend development by providing a simple yet powerful framework built on Node.js.

## Why Express.js?

Express.js offers:

- Minimalist approach
- Fast performance
- Rich middleware ecosystem
- Great community support

## Building APIs

Express makes it incredibly easy to build RESTful APIs. Here's a simple example:

\`\`\`javascript
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});
\`\`\`

## Middleware

One of Express's strongest features is its middleware system, which allows you to add functionality at various points in the request/response cycle.

## Conclusion

Express.js and Node.js provide a powerful combination for building modern backend services.`,
    author: 'Emul Sajib',
    date: 'February 10, 2024',
    tags: ['Node.js', 'Express', 'Backend'],
  },
  {
    title: 'Modern CSS Techniques for Beautiful UIs',
    excerpt: 'Discover advanced CSS techniques and modern approaches to creating stunning user interfaces.',
    content: `# Modern CSS Techniques for Beautiful UIs

Modern CSS offers powerful features that make it easier than ever to create beautiful, responsive user interfaces.

## CSS Grid and Flexbox

CSS Grid and Flexbox are game-changers for layout design. They provide:

- Flexible layouts
- Easy alignment
- Responsive design capabilities

## CSS Variables

CSS custom properties (variables) allow for:

- Theme switching
- Dynamic styling
- Better maintainability

## Animations

Modern CSS animations can create smooth, performant transitions without JavaScript.

## Conclusion

By leveraging modern CSS techniques, you can create stunning UIs that are both beautiful and performant.`,
    author: 'Emul Sajib',
    date: 'March 5, 2024',
    tags: ['CSS', 'Frontend', 'Design'],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Project.deleteMany({});
    await Achievement.deleteMany({});
    await BlogPost.deleteMany({});
    console.log('Cleared existing data');

    await Project.insertMany(projects);
    await Achievement.insertMany(achievements);
    await BlogPost.insertMany(blogPosts);
    console.log('Seeded projects, achievements, and blog posts');

    // Seed default admin user (skip if one already exists)
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
      await Admin.create({ username: 'admin', password: 'admin123' });
      console.log('Created default admin user (username: admin, password: admin123)');
    } else {
      console.log('Admin user already exists, skipping');
    }

    await mongoose.connection.close();
    console.log('Done — connection closed');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();

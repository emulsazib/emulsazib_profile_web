const professionalSummary = {
  headline: 'Product-minded Full-Stack Developer',
  blurb:
    'I help founders and teams ship delightful user experiences by combining thoughtful UX, performant frontends, and reliable APIs.',
};

// ── Work Experience ──
// Edit these entries with your real roles. Each entry powers one card in the
// "Work Experience" section on the home page. `current: true` shows a live badge
// and is expected to have `end: 'Present'`. `highlights` are bullet points and
// `stack` renders as pill tags — keep both concise for a scannable overview.
const experience = [
  {
    role: 'Full-Stack Developer',
    company: 'Freelance / Independent',
    type: 'Full-time',
    location: 'Dhaka, Bangladesh · Remote',
    start: 'Jan 2024',
    end: 'Present',
    current: true,
    summary:
      'Design and ship end-to-end web applications for founders and small teams, owning everything from UX to deployment.',
    highlights: [
      'Delivered production web apps with Express + PostgreSQL backends and responsive, accessible frontends.',
      'Built reusable UI systems and REST APIs that cut feature delivery time for follow-on work.',
      'Managed hosting, CI, and serverless deployments (Vercel) with zero-downtime database migrations.',
    ],
    stack: ['JavaScript', 'Node.js', 'Express', 'PostgreSQL', 'HTML/CSS'],
  },
  {
    role: 'Frontend Developer',
    company: 'Product Studio',
    type: 'Contract',
    location: 'Remote',
    start: 'Jun 2023',
    end: 'Dec 2023',
    current: false,
    summary:
      'Partnered with designers to turn Figma concepts into fast, pixel-accurate, accessible interfaces.',
    highlights: [
      'Implemented a component library adopted across multiple product screens.',
      'Improved Lighthouse performance and accessibility scores through targeted refactors.',
      'Collaborated in an agile team, shipping features in weekly iterations.',
    ],
    stack: ['JavaScript', 'React', 'CSS', 'REST APIs'],
  },
  {
    role: 'Junior Web Developer',
    company: 'Early Career',
    type: 'Internship',
    location: 'Dhaka, Bangladesh',
    start: 'Jan 2023',
    end: 'May 2023',
    current: false,
    summary:
      'Started my professional journey building and maintaining websites while learning modern development workflows.',
    highlights: [
      'Contributed to feature work and bug fixes across live client websites.',
      'Learned version control, code review, and collaborative development with Git.',
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'Git'],
  },
];

const timeline = [
  {
    year: '2024',
    milestone: 'Led platform modernization for a sustainability startup, cutting render time by 42%.',
  },
  {
    year: '2023',
    milestone: 'Mentored 5 junior engineers and launched a design system adopted across 3 product teams.',
  },
  {
    year: '2022',
    milestone: 'Scaled an IoT analytics API to ingest 2B events/day with zero downtime migrations.',
  },
];

module.exports = { professionalSummary, experience, timeline };

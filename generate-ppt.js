const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, 'lincoln-logo.png');
const logoExists = fs.existsSync(LOGO_PATH);

const pres = new PptxGenJS();

// Colors
const PRIMARY = '1F3864';    // Dark blue
const SECONDARY = '2E74B5';  // Medium blue
const ACCENT = 'C5A059';     // Gold
const LIGHT = 'F5F5DC';      // Beige
const DARK = '3E2723';       // Dark brown
const WHITE = 'FFFFFF';

// Helper: add logo to slide
function addLogo(slide) {
  if (logoExists) {
    slide.addImage({
      path: LOGO_PATH,
      x: 0.5,
      y: 0.3,
      w: 0.8,
      h: 0.8,
    });
  }
}

// Helper: add footer to slide
function addFooter(slide, slideNum) {
  slide.addText('Rootle FYP Documentation - Lincoln University', {
    x: 0.5,
    y: 7.0,
    w: 8,
    h: 0.3,
    fontSize: 10,
    color: '595959',
  });
  slide.addText(String(slideNum), {
    x: 12.5,
    y: 7.0,
    w: 0.5,
    h: 0.3,
    fontSize: 10,
    color: '595959',
    align: 'right',
  });
}

// Helper: add title bar
function addTitleBar(slide, title, subtitle) {
  // Top accent bar
  slide.addShape('rect', {
    x: 0, y: 0, w: 13.333, h: 0.12,
    fill: { color: ACCENT },
    line: { type: 'none' },
  });
  // Title
  slide.addText(title, {
    x: 0.7,
    y: 0.35,
    w: 11,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: PRIMARY,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.7,
      y: 1.05,
      w: 11,
      h: 0.4,
      fontSize: 14,
      color: SECONDARY,
    });
  }
  addLogo(slide);
}

// ============================================================
// SLIDE 1: Title Slide
// ============================================================
let slide = pres.addSlide();
slide.background = { color: PRIMARY };

// Logo
if (logoExists) {
  slide.addImage({
    path: LOGO_PATH,
    x: 6.17,
    y: 0.8,
    w: 1.5,
    h: 1.5,
  });
}

slide.addText('LINCOLN UNIVERSITY', {
  x: 0, y: 2.5, w: 13.333, h: 0.5,
  fontSize: 20, bold: true, color: ACCENT, align: 'center',
});

slide.addText('Department of Computer Science', {
  x: 0, y: 3.0, w: 13.333, h: 0.4,
  fontSize: 16, color: WHITE, align: 'center',
});

// Project Title
slide.addText('ROOTLE 2.0', {
  x: 0, y: 3.8, w: 13.333, h: 1.5,
  fontSize: 54, bold: true, color: WHITE, align: 'center',
});

slide.addText('A Decentralized Academic Resource Sharing Platform', {
  x: 0, y: 5.0, w: 13.333, h: 0.6,
  fontSize: 20, color: ACCENT, align: 'center',
});

slide.addText('Final Year Project Presentation', {
  x: 0, y: 5.7, w: 13.333, h: 0.4,
  fontSize: 16, color: WHITE, align: 'center',
});

slide.addText('Presented by: Rootle Development Team\nSupervisor: Mr. J. O. Adeyemi\nNovember 2026', {
  x: 0, y: 6.3, w: 13.333, h: 0.8,
  fontSize: 14, color: WHITE, align: 'center',
});

// ============================================================
// SLIDE 2: Introduction
// ============================================================
slide = pres.addSlide();
addTitleBar(slide, 'Introduction', 'Rootle 2.0 - Academic Resource Sharing Platform');

slide.addText('Education is the cornerstone of national development, and academic resources form the bedrock of effective teaching and learning.', {
  x: 0.7, y: 1.7, w: 11.9, h: 0.6,
  fontSize: 16, color: DARK,
});

slide.addText('In tertiary institutions, students and lecturers rely heavily on learning materials such as lecture notes, handouts, past examination questions, syllabi, and research papers.', {
  x: 0.7, y: 2.4, w: 11.9, h: 0.6,
  fontSize: 16, color: DARK,
});

slide.addText('However, academic resources are often scattered across individual lecturers\' collections, departmental offices, and informal student networks, creating information silos.', {
  x: 0.7, y: 3.1, w: 11.9, h: 0.6,
  fontSize: 16, color: DARK,
});

slide.addText('Rootle 2.0 was conceived to address this gap by providing a decentralized yet centralized academic resource sharing platform where students and staff can upload, share, discover, download, rate, and request academic resources in a secure, role-based environment.', {
  x: 0.7, y: 3.9, w: 11.9, h: 1.2,
  fontSize: 16, color: DARK,
});

addFooter(slide, 2);

// ============================================================
// SLIDE 3: Statement of Problem
// ============================================================
slide = pres.addSlide();
addTitleBar(slide, 'Statement of the Problem', 'Key Challenges Identified');

const problems = [
  'Fragmented Resource Distribution: Resources scattered across lecturers, departments, and student networks.',
  'No Centralized Repository: No unified platform for uploading and discovering academic resources across departments.',
  'Uncontrolled Access: No role-based access control to distinguish student from staff-verified content.',
  'No Resource Request Mechanism: No formal channel for students to request specific materials.',
  'No Quality Assurance: No rating system to identify high-quality, verified resources.',
  'Duplicate Content: Multiple uploads of the same file waste storage and create confusion.',
];

problems.forEach((prob, i) => {
  slide.addText((i + 1) + '. ' + prob, {
    x: 0.7, y: 1.8 + i * 0.75, w: 11.9, h: 0.65,
    fontSize: 15, color: DARK, bullet: { type: 'circle', color: ACCENT },
  });
});

addFooter(slide, 3);

// ============================================================
// SLIDE 4: Aims and Objectives
// ============================================================
slide = pres.addSlide();
addTitleBar(slide, 'Aims and Objectives', 'Project Goals');

slide.addText('Aim: To design and implement Rootle 2.0, a decentralized academic resource sharing platform for Lincoln University.', {
  x: 0.7, y: 1.7, w: 11.9, h: 0.6,
  fontSize: 16, bold: true, color: PRIMARY,
});

slide.addText('Specific Objectives:', {
  x: 0.7, y: 2.4, w: 11.9, h: 0.4,
  fontSize: 16, bold: true, color: DARK,
});

const objectives = [
  'Centralized digital repository for academic resources across departments and faculties.',
  'Four-tier role-based access control (Student, Lecturer, Admin, SuperAdmin) with JWT authentication.',
  'Staff verification key system with 120-second time-bound window for secure faculty onboarding.',
  'Resource upload with MD5 hash-based duplicate detection and GridFS file storage.',
  'Resource Request Hub for students to request materials and staff to fulfill requests.',
  'Rating system (download-before-rate) and gamified leaderboard with badge tiers.',
  'SuperAdmin dashboard for staff key management and system analytics.',
];

objectives.forEach((obj, i) => {
  slide.addText((i + 1) + '. ' + obj, {
    x: 0.7, y: 2.9 + i * 0.55, w: 11.9, h: 0.5,
    fontSize: 14, color: DARK, bullet: { type: 'circle', color: ACCENT },
  });
});

addFooter(slide, 4);

// ============================================================
// SLIDE 5: Goal
// ============================================================
slide = pres.addSlide();
addTitleBar(slide, 'Goal', 'Primary Project Objective');

slide.addText('To build a secure, decentralized academic resource sharing platform that improves access to learning materials across all departments and faculties at Lincoln University.', {
  x: 0.7, y: 2.2, w: 11.9, h: 1.0,
  fontSize: 20, bold: true, color: PRIMARY, align: 'center',
});

// Key goal elements
const goals = [
  { title: 'Accessibility', desc: '24/7 access to academic resources from any device' },
  { title: 'Security', desc: 'Role-based access control and staff key verification' },
  { title: 'Quality', desc: 'Download-based rating system ensures resource quality' },
  { title: 'Collaboration', desc: 'Peer-to-peer sharing across departments' },
];

goals.forEach((g, i) => {
  const x = 0.7 + i * 3.0;
  slide.addShape('rect', { x: x, y: 3.6, w: 2.6, h: 2.2, fill: { color: LIGHT }, line: { color: PRIMARY, width: 1 } });
  slide.addText(g.title, {
    x: x, y: 3.8, w: 2.6, h: 0.4,
    fontSize: 16, bold: true, color: PRIMARY, align: 'center',
  });
  slide.addText(g.desc, {
    x: x + 0.2, y: 4.3, w: 2.2, h: 1.2,
    fontSize: 12, color: DARK, align: 'center',
  });
});

addFooter(slide, 5);

// ============================================================
// SLIDE 6: Scope
// ============================================================
slide = pres.addSlide();
addTitleBar(slide, 'Scope', 'What the System Covers');

slide.addText('In Scope:', {
  x: 0.7, y: 1.7, w: 5.5, h: 0.4,
  fontSize: 16, bold: true, color: PRIMARY,
});

const inScope = [
  'User registration & authentication (4 roles)',
  'Staff key-based registration with 120s window',
  'Resource upload with categories & GridFS storage',
  'Resource approval workflow (student → staff)',
  'Search, filter, and trending resource discovery',
  'Download tracking & rating (post-download)',
  'Resource Request Hub & fulfillment',
  'Resource deletion request & moderation',
  'Gamified leaderboard with badge tiers',
  'SuperAdmin dashboard & staff key management',
  'Deployment on Vercel',
];

inScope.forEach((item, i) => {
  slide.addText('✓ ' + item, {
    x: 0.7, y: 2.1 + i * 0.38, w: 5.5, h: 0.35,
    fontSize: 13, color: DARK,
  });
});

slide.addText('Out of Scope:', {
  x: 7.0, y: 1.7, w: 5.5, h: 0.4,
  fontSize: 16, bold: true, color: DARK,
});

const outScope = [
  'Native mobile application',
  'Real-time chat or video conferencing',
  'Payment integration',
  'Offline access',
];

outScope.forEach((item, i) => {
  slide.addText('✗ ' + item, {
    x: 7.0, y: 2.1 + i * 0.38, w: 5.5, h: 0.35,
    fontSize: 13, color: '8B0000',
  });
});

addFooter(slide, 6);

// ============================================================
// SLIDE 7: Literature Review (Small)
// ============================================================
slide = pres.addSlide();
addTitleBar(slide, 'Literature Review', 'Existing Systems & Theories');

slide.addText('Key Theoretical Foundations:', {
  x: 0.7, y: 1.7, w: 6.0, h: 0.4,
  fontSize: 16, bold: true, color: PRIMARY,
});

const theories = [
  'Technology Acceptance Model (TAM): Perceived usefulness & ease of use drive adoption.',
  'Social Constructivism: Knowledge built through social interaction and collaboration.',
];

theories.forEach((t, i) => {
  slide.addText('• ' + t, {
    x: 0.7, y: 2.1 + i * 0.55, w: 6.0, h: 0.5,
    fontSize: 13, color: DARK,
  });
});

slide.addText('Related Systems Reviewed:', {
  x: 7.0, y: 1.7, w: 5.5, h: 0.4,
  fontSize: 16, bold: true, color: PRIMARY,
});

const systems = [
  'Moodle: Course-centric LMS, no cross-department discovery.',
  'Google Classroom: Tied to individual classes.',
  'Canvas LMS: Expensive, course-centric.',
  'DSpace: Research-focused, not teaching materials.',
  'Gap: No unified decentralized platform with RBAC + request hub + leaderboard.',
];

systems.forEach((s, i) => {
  slide.addText('• ' + s, {
    x: 7.0, y: 2.1 + i * 0.55, w: 5.5, h: 0.5,
    fontSize: 13, color: DARK,
  });
});

addFooter(slide, 7);

// ============================================================
// SLIDE 8: Methodology
// ============================================================
slide = pres.addSlide();
addTitleBar(slide, 'Methodology', 'Development Approach');

slide.addText('Agile SDLC Methodology:', {
  x: 0.7, y: 1.7, w: 6.0, h: 0.4,
  fontSize: 16, bold: true, color: PRIMARY,
});

const phases = [
  'Phase 1: Requirements Gathering - Surveys & interviews with students/lecturers',
  'Phase 2: System Design - Architecture, database schema, API design',
  'Phase 3: Implementation - React.js frontend, Node.js/Express backend',
  'Phase 4: Testing - Unit, integration, and user acceptance testing',
  'Phase 5: Deployment - Vercel cloud deployment',
  'Phase 6: Maintenance - Bug fixes & feature enhancements',
];

phases.forEach((p, i) => {
  slide.addText(p, {
    x: 0.7, y: 2.1 + i * 0.55, w: 6.0, h: 0.5,
    fontSize: 13, color: DARK, bullet: { type: 'circle', color: ACCENT },
  });
});

slide.addText('Tech Stack:', {
  x: 7.0, y: 1.7, w: 5.5, h: 0.4,
  fontSize: 16, bold: true, color: PRIMARY,
});

const stack = [
  'Frontend: React.js, Vite, Tailwind CSS, Framer Motion',
  'Backend: Node.js, Express.js',
  'Database: MongoDB + Mongoose ODM + GridFS',
  'Auth: JWT + bcrypt password hashing',
  'Files: Multer (memory storage), MD5 deduplication',
  'Deployment: Vercel',
];

stack.forEach((s, i) => {
  slide.addText(s, {
    x: 7.0, y: 2.1 + i * 0.55, w: 5.5, h: 0.5,
    fontSize: 13, color: DARK, bullet: { type: 'circle', color: ACCENT },
  });
});

addFooter(slide, 8);

// ============================================================
// SLIDE 9: Interpretation of Results
// ============================================================
slide = pres.addSlide();
addTitleBar(slide, 'Interpretation of Results', 'Testing & Evaluation Outcomes');

slide.addText('All 8 test cases passed:', {
  x: 0.7, y: 1.7, w: 6.0, h: 0.4,
  fontSize: 16, bold: true, color: PRIMARY,
});

const results = [
  'User Registration: All role types registered successfully.',
  'Staff Key Validation: 120-second window enforced correctly.',
  'Resource Upload: Duplicate detection via MD5 hash working.',
  'Resource Download: GridFS file streaming functional.',
  'Resource Rating: Download-before-rating enforced.',
  'Role-Based Access Control: Boundaries enforced for all roles.',
  'Request Hub: Creation and fulfillment working.',
  'Leaderboard: Badge tiers calculated correctly.',
];

results.forEach((r, i) => {
  slide.addText('✓ ' + r, {
    x: 0.7, y: 2.1 + i * 0.45, w: 6.0, h: 0.4,
    fontSize: 13, color: DARK,
  });
});

slide.addText('System Evaluation:', {
  x: 7.0, y: 1.7, w: 5.5, h: 0.4,
  fontSize: 16, bold: true, color: PRIMARY,
});

const evals = [
  'Functionality: All core features work as specified.',
  'Usability: Ease of use rated 4.2/5 by 30 UAT participants.',
  'Security: RBAC, JWT, bcrypt, staff key windows robust.',
  'Performance: Acceptable response times under normal load.',
  'Reliability: Data integrity maintained via duplicate detection.',
];

evals.forEach((e, i) => {
  slide.addText('• ' + e, {
    x: 7.0, y: 2.1 + i * 0.55, w: 5.5, h: 0.5,
    fontSize: 13, color: DARK,
  });
});

addFooter(slide, 9);

// ============================================================
// SLIDE 10: Conclusion and Recommendations
// ============================================================
slide = pres.addSlide();
addTitleBar(slide, 'Conclusion and Recommendations', 'Project Outcomes & Next Steps');

slide.addText('Conclusion:', {
  x: 0.7, y: 1.7, w: 6.0, h: 0.4,
  fontSize: 16, bold: true, color: PRIMARY,
});

slide.addText('Rootle 2.0 successfully implements a decentralized academic resource sharing platform that improves access to learning materials across Lincoln University. All specified objectives have been implemented and tested for functionality, security, usability, and reliability.', {
  x: 0.7, y: 2.1, w: 6.0, h: 1.2,
  fontSize: 14, color: DARK,
});

slide.addText('Recommendations:', {
  x: 7.0, y: 1.7, w: 5.5, h: 0.4,
  fontSize: 16, bold: true, color: PRIMARY,
});

const recs = [
  'Adopt Rootle 2.0 as the official academic resource platform.',
  'Provide training for students and staff.',
  'Integrate with university SSO authentication.',
  'Provision additional storage as the library grows.',
  'Develop a mobile application version.',
  'Conduct regular security audits.',
];

recs.forEach((r, i) => {
  slide.addText('• ' + r, {
    x: 7.0, y: 2.1 + i * 0.55, w: 5.5, h: 0.5,
    fontSize: 13, color: DARK, bullet: { type: 'circle', color: ACCENT },
  });
});

addFooter(slide, 10);

// ============================================================
// SLIDE 11: References
// ============================================================
slide = pres.addSlide();
addTitleBar(slide, 'References', 'Cited Works');

const refs = [
  'Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. MIS Quarterly.',
  'Deterding et al. (2011). From game design elements to gamefulness: Defining "gamification". MindTrek Conference.',
  'Ferraiolo et al. (2001). Role-Based Access Control. Artech House.',
  'Hamari et al. (2014). Does gamification work? A literature review. Hawaii International Conference on System Sciences.',
  'MongoDB Documentation (2026). GridFS.',
  'Node.js Documentation (2026).',
  'React Documentation (2026).',
  'Tailwind CSS Documentation (2026).',
  'Vercel Documentation (2026).',
];

refs.forEach((r, i) => {
  slide.addText((i + 1) + '. ' + r, {
    x: 0.7, y: 1.8 + i * 0.45, w: 11.9, h: 0.4,
    fontSize: 12, color: DARK,
  });
});

addFooter(slide, 11);

// ============================================================
// SLIDE 12: Thank You
// ============================================================
slide = pres.addSlide();
slide.background = { color: PRIMARY };

if (logoExists) {
  slide.addImage({
    path: LOGO_PATH,
    x: 6.17,
    y: 1.2,
    w: 1.5,
    h: 1.5,
  });
}

slide.addText('LINCOLN UNIVERSITY', {
  x: 0, y: 2.9, w: 13.333, h: 0.5,
  fontSize: 20, bold: true, color: ACCENT, align: 'center',
});

slide.addText('Thank You!', {
  x: 0, y: 3.5, w: 13.333, h: 1.2,
  fontSize: 48, bold: true, color: WHITE, align: 'center',
});

slide.addText('Questions & Discussion', {
  x: 0, y: 4.8, w: 13.333, h: 0.5,
  fontSize: 18, color: ACCENT, align: 'center',
});

slide.addText('Rootle 2.0 - A Decentralized Academic Resource Sharing Platform\nDepartment of Computer Science, Lincoln University\nNovember 2026', {
  x: 0, y: 5.6, w: 13.333, h: 0.8,
  fontSize: 14, color: WHITE, align: 'center',
});

// Save presentation
pres.writeFile('Rootle_FYP_Presentation.pptx').then(() => {
  console.log('PowerPoint presentation saved: Rootle_FYP_Presentation.pptx');
}).catch((err) => {
  console.error('Error saving presentation:', err);
});

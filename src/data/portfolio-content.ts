import type { CurvedWaypoint } from "@/lib/journey-path";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CENTRALIZED PORTFOLIO CONTENT & PLACEHOLDER REGISTRY
 * -------------------------------------------------------------------------------
 * Replace placeholder strings, `imageUrl`, `assetUrl`, and external URLs here
 * without touching any section component or animation choreography.
 *
 * Palette lock (enforced across all chapters after Hero):
 * - Primary Burgundy: #792B33
 * - Warm Ivory:       #F3E9DE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type ChapterSurface = "burgundy" | "ivory";

export interface ChapterDefinition {
  id: string;
  number: string;
  label: string;
  title: string;
  surface: ChapterSurface;
}

export const CHAPTERS: readonly ChapterDefinition[] = [
  { id: "about", number: "01", label: "About", title: "More Than Meets the Eye.", surface: "burgundy" },
  { id: "projects", number: "02", label: "Projects", title: "Ideas, Given Form.", surface: "ivory" },
  { id: "playground", number: "03", label: "Playground", title: "What If I Tried This?", surface: "ivory" },
  { id: "skills", number: "04", label: "Skills", title: "The Art of Making Things.", surface: "burgundy" },
  { id: "experience", number: "05", label: "Experience", title: "Every Path Leaves a Mark.", surface: "ivory" },
  { id: "education", number: "06", label: "Education", title: "Roots Before Wings.", surface: "burgundy" },
  { id: "achievements", number: "07", label: "Achievements", title: "Small Victories. Long Roads.", surface: "burgundy" },
  { id: "contact", number: "08", label: "Contact", title: "The Story Isn't Finished.", surface: "ivory" },
] as const;

export const PRIMARY_NAV_CHAPTERS = [
  "about",
  "projects",
  "playground",
  "experience",
  "contact",
] as const;

/* ── CHAPTER 01 · ABOUT & PHILOSOPHY ─────────────────────────────────────────── */

export const ABOUT_CONTENT = {
  chapterNumber: "01",
  chapterLabel: "About & Philosophy",
  heading: "MORE THAN MEETS THE EYE.",
  headlineLead: "I'm the kind of person",
  headlineItalic: "who...",
  mainStatement: "I'm the kind of person who can't leave a question unanswered.",
  supportingStatement:
    "Sometimes it becomes a project. Sometimes an experiment. Sometimes a very long night.",
  storyStatements: [
    {
      index: "01",
      text: "can't leave a question unanswered.",
    },
    {
      index: "02",
      text: "builds things to understand how they work.",
    },
    {
      index: "03",
      text: "turns ideas into working systems.",
    },
    {
      index: "04",
      text: "gets lost in the details.",
    },
  ],
  manifestoBeats: [
    {
      index: "01 / 04",
      lead: "I'm the kind of person who",
      accent: "...",
    },
    {
      index: "02 / 04",
      words: ["CAN'T", "LEAVE", "A"],
    },
    {
      index: "03 / 04",
      primary: "QUESTION",
      italic: "unanswered.",
    },
    {
      index: "04 / 04",
      lines: [
        { prefix: "Sometimes it becomes a ", emphasis: "project." },
        { prefix: "Sometimes an ", emphasis: "experiment." },
        { prefix: "Sometimes a ", emphasis: "very long night." },
      ],
    },
  ],
  philosophyParagraphs: [
    "I've always been fascinated by how things work. Not just what they do, but what happens when you push them a little further.",
    "Sometimes that means building something from scratch. Other times, it means taking something apart, questioning the obvious, or following an idea simply because it interests me.",
    "I don't think I'll ever know everything. But that's what makes the journey interesting.",
  ],
  sumieArtwork: {
    pineSrc: "/assets/about/sumie-pine.webp",
    pineAlt: "Traditional Japanese sumi-e ink-wash black pine branch entering from the right edge",
    mountainsSrc: "/assets/about/sumie-mountains.webp",
    mountainsAlt: "Faint distant Japanese sumi-e ink-wash mountain silhouettes along the horizon",
  },
  characterSlot: {
    slotId: "unmasked-cat-3d",
    label: "3D CHARACTER / COMING SOON",
    sublabel: "Future Unmasked Cat · GLB / Spline Ready",
    assetUrl: null as string | null,
  },
} as const;

/* ── CHAPTER 02 · SELECTED PROJECTS ──────────────────────────────────────────── */

export interface ProjectGallerySlide {
  id: string;
  label: string;
  caption: string;
  imageUrl: string | null;
}

export interface PortfolioProject {
  id: string;
  number: string;
  title: string;
  category: string;
  shortDescription: string;
  previewLabel: string;
  heroImageUrl: string | null;
  technologies: readonly string[];
  demoUrl: string | null;
  githubUrl: string | null;
  caseStudy: {
    overview: string;
    problem: string;
    approach: string;
    solution: string;
    technicalArchitecture: readonly string[];
    challengesAndLessons: readonly string[];
    gallery: readonly ProjectGallerySlide[];
  };
}

export const PROJECTS_CONTENT = {
  chapterNumber: "02",
  chapterLabel: "Selected Projects",
  heading: "IDEAS, GIVEN FORM.",
  supportingText: "An idea is only the beginning. What matters is what you make of it.",
} as const;

export const PROJECTS: readonly PortfolioProject[] = [
  {
    id: "project-01",
    number: "01",
    title: "Project One",
    category: "AI / Machine Learning",
    shortDescription: "Project description coming soon",
    previewLabel: "PROJECT PREVIEW · 01",
    heroImageUrl: null,
    technologies: ["Technology Tag 01", "Technology Tag 02", "Technology Tag 03", "Technology Tag 04"],
    demoUrl: null,
    githubUrl: null,
    caseStudy: {
      overview: "Project overview placeholder — replace with final context, scope, and role once case study content is ready.",
      problem: "Problem statement placeholder — outline the technical or human constraint that initiated this AI / Machine Learning project.",
      approach: "Approach placeholder — document research direction, model or architecture trade-offs, and key prototypes.",
      solution: "Solution placeholder — describe the final shipped system, interaction loop, and core design decisions.",
      technicalArchitecture: [
        "Architecture layer 01 placeholder — ingestion, pipeline, or model serving boundary.",
        "Architecture layer 02 placeholder — orchestration, state synchronization, or interface layer.",
        "Architecture layer 03 placeholder — evaluation, observability, or deployment workflow.",
      ],
      challengesAndLessons: [
        "Key technical challenge placeholder — note bottlenecks or unexpected edge cases discovered in practice.",
        "Lesson learned placeholder — capture what you would design differently next time.",
      ],
      gallery: [
        { id: "p1-g1", label: "SCREENSHOT 01 · COMING SOON", caption: "Primary interface or architecture view placeholder.", imageUrl: null },
        { id: "p1-g2", label: "SCREENSHOT 02 · COMING SOON", caption: "System workflow or evaluation visual placeholder.", imageUrl: null },
        { id: "p1-g3", label: "SCREENSHOT 03 · COMING SOON", caption: "Detail frame or interaction breakdown placeholder.", imageUrl: null },
      ],
    },
  },
  {
    id: "project-02",
    number: "02",
    title: "Project Two",
    category: "Full-Stack Development",
    shortDescription: "Project description coming soon",
    previewLabel: "PROJECT PREVIEW · 02",
    heroImageUrl: null,
    technologies: ["Technology Tag 01", "Technology Tag 02", "Technology Tag 03", "Technology Tag 04"],
    demoUrl: null,
    githubUrl: null,
    caseStudy: {
      overview: "Project overview placeholder — replace with final product summary and engineering ownership.",
      problem: "Problem statement placeholder — capture the workflow gap or scaling challenge this full-stack build addresses.",
      approach: "Approach placeholder — detail API contracts, data modeling choices, and frontend architecture.",
      solution: "Solution placeholder — summarize the complete end-to-end experience and system boundaries.",
      technicalArchitecture: [
        "Architecture layer 01 placeholder — client application, state model, and rendering strategy.",
        "Architecture layer 02 placeholder — backend API services, authentication, and business logic.",
        "Architecture layer 03 placeholder — persistence schema, caching, and infrastructure.",
      ],
      challengesAndLessons: [
        "Key technical challenge placeholder — highlight real-world integration or performance trade-offs.",
        "Lesson learned placeholder — document architectural takeaways for future systems.",
      ],
      gallery: [
        { id: "p2-g1", label: "SCREENSHOT 01 · COMING SOON", caption: "Main application workspace placeholder.", imageUrl: null },
        { id: "p2-g2", label: "SCREENSHOT 02 · COMING SOON", caption: "Data flow and interactive detail placeholder.", imageUrl: null },
        { id: "p2-g3", label: "SCREENSHOT 03 · COMING SOON", caption: "Responsive layout study placeholder.", imageUrl: null },
      ],
    },
  },
  {
    id: "project-03",
    number: "03",
    title: "Project Three",
    category: "Desktop Application",
    shortDescription: "Project description coming soon",
    previewLabel: "PROJECT PREVIEW · 03",
    heroImageUrl: null,
    technologies: ["Technology Tag 01", "Technology Tag 02", "Technology Tag 03", "Technology Tag 04"],
    demoUrl: null,
    githubUrl: null,
    caseStudy: {
      overview: "Project overview placeholder — replace with desktop tool purpose, target audience, and native capabilities.",
      problem: "Problem statement placeholder — explain why a dedicated desktop environment was necessary.",
      approach: "Approach placeholder — cover native OS integration, local-first storage, and performance targets.",
      solution: "Solution placeholder — detail the finished desktop workflow, keyboard ergonomics, and responsiveness.",
      technicalArchitecture: [
        "Architecture layer 01 placeholder — native shell, IPC bridge, or window lifecycle.",
        "Architecture layer 02 placeholder — local compute engine, file system handling, or worker threads.",
        "Architecture layer 03 placeholder — packaging, updates, and cross-platform distribution.",
      ],
      challengesAndLessons: [
        "Key technical challenge placeholder — note OS-specific constraints or memory management hurdles.",
        "Lesson learned placeholder — summarize ergonomics and native reliability takeaways.",
      ],
      gallery: [
        { id: "p3-g1", label: "SCREENSHOT 01 · COMING SOON", caption: "Desktop application frame placeholder.", imageUrl: null },
        { id: "p3-g2", label: "SCREENSHOT 02 · COMING SOON", caption: "Command palette or inspector view placeholder.", imageUrl: null },
        { id: "p3-g3", label: "SCREENSHOT 03 · COMING SOON", caption: "Local workflow detail placeholder.", imageUrl: null },
      ],
    },
  },
  {
    id: "project-04",
    number: "04",
    title: "Project Four",
    category: "Creative Experiment",
    shortDescription: "Project description coming soon",
    previewLabel: "PROJECT PREVIEW · 04",
    heroImageUrl: null,
    technologies: ["Technology Tag 01", "Technology Tag 02", "Technology Tag 03", "Technology Tag 04"],
    demoUrl: null,
    githubUrl: null,
    caseStudy: {
      overview: "Project overview placeholder — replace with the creative question and visual direction behind this piece.",
      problem: "Problem statement placeholder — outline the artistic or real-time interaction challenge being explored.",
      approach: "Approach placeholder — share shader studies, procedural math, or interaction experiments.",
      solution: "Solution placeholder — explain how the visual system responds to motion, input, or sound.",
      technicalArchitecture: [
        "Architecture layer 01 placeholder — rendering pipeline, canvas/WebGL setup, or animation system.",
        "Architecture layer 02 placeholder — procedural algorithms, input mapping, and frame pacing.",
        "Architecture layer 03 placeholder — asset optimization and graceful fallback behavior.",
      ],
      challengesAndLessons: [
        "Key technical challenge placeholder — document balancing visual ambition with smooth frame rates.",
        "Lesson learned placeholder — note insights gained from creative coding exploration.",
      ],
      gallery: [
        { id: "p4-g1", label: "SCREENSHOT 01 · COMING SOON", caption: "Hero visual composition placeholder.", imageUrl: null },
        { id: "p4-g2", label: "SCREENSHOT 02 · COMING SOON", caption: "Interactive state study placeholder.", imageUrl: null },
        { id: "p4-g3", label: "SCREENSHOT 03 · COMING SOON", caption: "Motion breakdown placeholder.", imageUrl: null },
      ],
    },
  },
];

/* ── CHAPTER 03 · THE PLAYGROUND / EXPERIMENTS ───────────────────────────────── */

export interface PlaygroundExperiment {
  id: string;
  code: string;
  title: string;
  category: string;
  status: string;
  shortDescription: string;
  expandedExplanation: string;
  mediaKind: "image" | "3d";
  mediaUrl: string | null;
  technologies: readonly string[];
  externalUrl: string | null;
  /** Curated exhibition grid layout hints */
  layout: {
    colSpanClass: string;
    aspectClass: string;
    rotateDeg: number;
    offsetYClass: string;
  };
}

export const PLAYGROUND_CONTENT = {
  chapterNumber: "03",
  chapterLabel: "The Playground",
  heading: "WHAT IF I TRIED THIS?",
  supportingText: "Not everything needs a purpose. Sometimes curiosity is reason enough.",
} as const;

export const EXPERIMENTS: readonly PlaygroundExperiment[] = [
  {
    id: "exp-001",
    code: "001",
    title: "Experiment 001",
    category: "Prototype · Placeholder",
    status: "Placeholder Slot",
    shortDescription: "Short experiment description coming soon.",
    expandedExplanation:
      "Expanded notes placeholder for Experiment 001. Replace with the original spark, technical sketch, and observations once ready.",
    mediaKind: "3d",
    mediaUrl: null,
    technologies: ["Tech Placeholder A", "Tech Placeholder B"],
    externalUrl: null,
    layout: {
      colSpanClass: "md:col-span-7",
      aspectClass: "aspect-[16/10]",
      rotateDeg: -1.1,
      offsetYClass: "md:mt-0",
    },
  },
  {
    id: "exp-002",
    code: "002",
    title: "Experiment 002",
    category: "Interactive Study · Placeholder",
    status: "Placeholder Slot",
    shortDescription: "Short experiment description coming soon.",
    expandedExplanation:
      "Expanded notes placeholder for Experiment 002. Replace with interaction details, sketches, or prototype learnings.",
    mediaKind: "image",
    mediaUrl: null,
    technologies: ["Tech Placeholder A", "Tech Placeholder C"],
    externalUrl: null,
    layout: {
      colSpanClass: "md:col-span-5",
      aspectClass: "aspect-[4/5]",
      rotateDeg: 1.4,
      offsetYClass: "md:mt-14",
    },
  },
  {
    id: "exp-003",
    code: "003",
    title: "Experiment 003",
    category: "Hardware / Systems · Placeholder",
    status: "Placeholder Slot",
    shortDescription: "Short experiment description coming soon.",
    expandedExplanation:
      "Expanded notes placeholder for Experiment 003. Suitable for physical computing, micro-tools, or late-night explorations.",
    mediaKind: "image",
    mediaUrl: null,
    technologies: ["Tech Placeholder B", "Tech Placeholder D"],
    externalUrl: null,
    layout: {
      colSpanClass: "md:col-span-4",
      aspectClass: "aspect-[1/1]",
      rotateDeg: -1.5,
      offsetYClass: "md:-mt-8",
    },
  },
  {
    id: "exp-004",
    code: "004",
    title: "Experiment 004",
    category: "Visual / Shader · Placeholder",
    status: "Placeholder Slot",
    shortDescription: "Short experiment description coming soon.",
    expandedExplanation:
      "Expanded notes placeholder for Experiment 004. Replace with visual mechanics, shaders, or motion experiments.",
    mediaKind: "3d",
    mediaUrl: null,
    technologies: ["Tech Placeholder A", "Tech Placeholder E"],
    externalUrl: null,
    layout: {
      colSpanClass: "md:col-span-8",
      aspectClass: "aspect-[16/9]",
      rotateDeg: 0.9,
      offsetYClass: "md:mt-6",
    },
  },
  {
    id: "exp-005",
    code: "005",
    title: "Experiment 005",
    category: "Micro-Application · Placeholder",
    status: "Placeholder Slot",
    shortDescription: "Short experiment description coming soon.",
    expandedExplanation:
      "Expanded notes placeholder for Experiment 005. Document what small itch or curiosity prompted this build.",
    mediaKind: "image",
    mediaUrl: null,
    technologies: ["Tech Placeholder C", "Tech Placeholder D"],
    externalUrl: null,
    layout: {
      colSpanClass: "md:col-span-6",
      aspectClass: "aspect-[16/11]",
      rotateDeg: -0.8,
      offsetYClass: "md:mt-4",
    },
  },
  {
    id: "exp-006",
    code: "006",
    title: "Experiment 006",
    category: "Unusual Idea · Placeholder",
    status: "Placeholder Slot",
    shortDescription: "Short experiment description coming soon.",
    expandedExplanation:
      "Expanded notes placeholder for Experiment 006. Add screenshots, embedded demos, or notes when available.",
    mediaKind: "3d",
    mediaUrl: null,
    technologies: ["Tech Placeholder B", "Tech Placeholder E"],
    externalUrl: null,
    layout: {
      colSpanClass: "md:col-span-6",
      aspectClass: "aspect-[16/11]",
      rotateDeg: 1.2,
      offsetYClass: "md:mt-16",
    },
  },
];

/* ── CHAPTER 04 · SKILLS & TECHNOLOGY ────────────────────────────────────────── */

export interface SkillToolEntry {
  name: string;
  note: string;
}

export interface SkillCategory {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  summary: string;
  tools: readonly SkillToolEntry[];
}

export const SKILLS_CONTENT = {
  chapterNumber: "04",
  chapterLabel: "Skills & Technology",
  heading: "THE ART OF MAKING THINGS.",
  supportingText: "Different problems call for different tools. I enjoy learning both.",
} as const;

export const SKILL_CATEGORIES: readonly SkillCategory[] = [
  {
    id: "languages",
    number: "01",
    title: "Languages",
    shortTitle: "Languages",
    summary: "Editable language placeholders — replace with your primary and secondary programming languages.",
    tools: [
      { name: "Language Placeholder 01", note: "Primary systems / application" },
      { name: "Language Placeholder 02", note: "Scripting / ML workflows" },
      { name: "Language Placeholder 03", note: "Web / typed interfaces" },
      { name: "Language Placeholder 04", note: "Low-level / performance" },
      { name: "Language Placeholder 05", note: "Query / shader syntax" },
    ],
  },
  {
    id: "frontend",
    number: "02",
    title: "Frontend",
    shortTitle: "Frontend",
    summary: "Editable frontend framework, motion, and creative rendering placeholders.",
    tools: [
      { name: "Frontend Tool 01", note: "Component architecture" },
      { name: "Frontend Tool 02", note: "Routing & SSR" },
      { name: "Frontend Tool 03", note: "Styling & design tokens" },
      { name: "Frontend Tool 04", note: "Scroll & timeline motion" },
      { name: "Frontend Tool 05", note: "WebGL / 3D interfaces" },
    ],
  },
  {
    id: "backend",
    number: "03",
    title: "Backend",
    shortTitle: "Backend",
    summary: "Editable API, runtime, messaging, and distributed service placeholders.",
    tools: [
      { name: "Backend Tool 01", note: "API design & services" },
      { name: "Backend Tool 02", note: "Real-time / streaming" },
      { name: "Backend Tool 03", note: "Authentication & security" },
      { name: "Backend Tool 04", note: "Background workers" },
      { name: "Backend Tool 05", note: "Protocol & RPC layer" },
    ],
  },
  {
    id: "ai-ml",
    number: "04",
    title: "Artificial Intelligence & Machine Learning",
    shortTitle: "AI & ML",
    summary: "Editable modeling, inference, evaluation, and applied AI placeholders.",
    tools: [
      { name: "AI / ML Tool 01", note: "Model training & experimentation" },
      { name: "AI / ML Tool 02", note: "Inference & orchestration" },
      { name: "AI / ML Tool 03", note: "Retrieval & embeddings" },
      { name: "AI / ML Tool 04", note: "Evaluation & benchmarks" },
      { name: "AI / ML Tool 05", note: "Multimodal / agentic workflows" },
    ],
  },
  {
    id: "databases",
    number: "05",
    title: "Databases",
    shortTitle: "Databases",
    summary: "Editable relational, analytical, vector, and caching store placeholders.",
    tools: [
      { name: "Database Tool 01", note: "Relational persistence" },
      { name: "Database Tool 02", note: "Document / flexible schemas" },
      { name: "Database Tool 03", note: "In-memory caching" },
      { name: "Database Tool 04", note: "Vector / search indexing" },
    ],
  },
  {
    id: "devops-cloud",
    number: "06",
    title: "DevOps & Cloud",
    shortTitle: "DevOps & Cloud",
    summary: "Editable containerization, deployment, CI/CD, and cloud infrastructure placeholders.",
    tools: [
      { name: "Cloud / DevOps Tool 01", note: "Containers & packaging" },
      { name: "Cloud / DevOps Tool 02", note: "Orchestration & scaling" },
      { name: "Cloud / DevOps Tool 03", note: "CI/CD automation" },
      { name: "Cloud / DevOps Tool 04", note: "Cloud compute & storage" },
      { name: "Cloud / DevOps Tool 05", note: "Monitoring & telemetry" },
    ],
  },
  {
    id: "tools-systems",
    number: "07",
    title: "Tools & Systems",
    shortTitle: "Tools & Systems",
    summary: "Editable developer environment, operating system, and creative pipeline placeholders.",
    tools: [
      { name: "System Tool 01", note: "Version control & collaboration" },
      { name: "System Tool 02", note: "Unix / terminal workflows" },
      { name: "System Tool 03", note: "Design & prototyping" },
      { name: "System Tool 04", note: "3D & asset pipeline" },
    ],
  },
];

/* ── CHAPTER 05 · EXPERIENCE & JOURNEY ───────────────────────────────────────── */

export interface ExperienceMediaSlide {
  id: string;
  label: string;
  caption: string;
  imageUrl: string | null;
}

export interface ExperienceStop {
  id: string;
  number: string;
  companyName: string;
  roleTitle: string;
  dates: string;
  location: string;
  logoUrl: string | null;
  companyUrl: string | null;
  overview: string;
  responsibilities: readonly string[];
  achievements: readonly string[];
  technologies: readonly string[];
  media: readonly ExperienceMediaSlide[];
  waypoint: CurvedWaypoint;
}

export const EXPERIENCE_CONTENT = {
  chapterNumber: "05",
  chapterLabel: "Experience & Journey",
  heading: "EVERY PATH LEAVES A MARK.",
  supportingText: "Different places. Different challenges. Something learned at every stop.",
} as const;

export const EXPERIENCE_STOPS: readonly ExperienceStop[] = [
  {
    id: "company-01",
    number: "01",
    companyName: "Company 01",
    roleTitle: "Role Placeholder",
    dates: "Start Date — End Date",
    location: "Location Placeholder",
    logoUrl: null,
    companyUrl: null,
    overview:
      "Short overview placeholder for Company 01. Replace with the team context, product focus, and what drew you to this stop.",
    responsibilities: [
      "Primary responsibility placeholder 01 — core engineering or product contribution.",
      "Primary responsibility placeholder 02 — collaboration, architecture, or delivery scope.",
    ],
    achievements: [
      "Milestone placeholder 01 — replace with verified outcome once ready.",
      "Milestone placeholder 02 — replace with concrete learning or shipped deliverable.",
    ],
    technologies: ["Stack Tag 01", "Stack Tag 02", "Stack Tag 03"],
    media: [
      { id: "c1-m1", label: "ARTIFACT 01 · COMING SOON", caption: "Project visual or team snapshot placeholder.", imageUrl: null },
      { id: "c1-m2", label: "ARTIFACT 02 · COMING SOON", caption: "Architecture or release highlight placeholder.", imageUrl: null },
    ],
    waypoint: { id: "company-01", stop: 0, x: 115, y: 465 },
  },
  {
    id: "company-02",
    number: "02",
    companyName: "Company 02",
    roleTitle: "Role Placeholder",
    dates: "Start Date — End Date",
    location: "Location Placeholder",
    logoUrl: null,
    companyUrl: null,
    overview:
      "Short overview placeholder for Company 02. Replace with domain challenges and the problems you explored during this chapter.",
    responsibilities: [
      "Primary responsibility placeholder 01 — systems design or interface ownership.",
      "Primary responsibility placeholder 02 — cross-functional delivery or tooling.",
    ],
    achievements: [
      "Milestone placeholder 01 — replace with verified project outcome.",
      "Milestone placeholder 02 — replace with notable craft highlight.",
    ],
    technologies: ["Stack Tag 01", "Stack Tag 02", "Stack Tag 03"],
    media: [
      { id: "c2-m1", label: "ARTIFACT 01 · COMING SOON", caption: "Product screen or workflow placeholder.", imageUrl: null },
      { id: "c2-m2", label: "ARTIFACT 02 · COMING SOON", caption: "Engineering note or visual placeholder.", imageUrl: null },
    ],
    waypoint: { id: "company-02", stop: 1 / 3, x: 435, y: 185 },
  },
  {
    id: "company-03",
    number: "03",
    companyName: "Company 03",
    roleTitle: "Role Placeholder",
    dates: "Start Date — End Date",
    location: "Location Placeholder",
    logoUrl: null,
    companyUrl: null,
    overview:
      "Short overview placeholder for Company 03. Replace with technical focus, scale, and key engineering decisions.",
    responsibilities: [
      "Primary responsibility placeholder 01 — end-to-end feature or platform engineering.",
      "Primary responsibility placeholder 02 — mentoring, code quality, or technical strategy.",
    ],
    achievements: [
      "Milestone placeholder 01 — replace with verified milestone.",
      "Milestone placeholder 02 — replace with notable system improvement.",
    ],
    technologies: ["Stack Tag 01", "Stack Tag 02", "Stack Tag 03"],
    media: [
      { id: "c3-m1", label: "ARTIFACT 01 · COMING SOON", caption: "System overview placeholder.", imageUrl: null },
      { id: "c3-m2", label: "ARTIFACT 02 · COMING SOON", caption: "Shipped interface placeholder.", imageUrl: null },
    ],
    waypoint: { id: "company-03", stop: 2 / 3, x: 775, y: 425 },
  },
  {
    id: "company-04",
    number: "04",
    companyName: "Company 04",
    roleTitle: "Role Placeholder",
    dates: "Start Date — Present",
    location: "Location Placeholder",
    logoUrl: null,
    companyUrl: null,
    overview:
      "Short overview placeholder for Company 04. Replace with current or most recent role context and direction.",
    responsibilities: [
      "Primary responsibility placeholder 01 — leading architecture or experimental initiatives.",
      "Primary responsibility placeholder 02 — shipping high-craft production software.",
    ],
    achievements: [
      "Milestone placeholder 01 — replace with verified current milestone.",
      "Milestone placeholder 02 — replace with key technical breakthrough.",
    ],
    technologies: ["Stack Tag 01", "Stack Tag 02", "Stack Tag 03"],
    media: [
      { id: "c4-m1", label: "ARTIFACT 01 · COMING SOON", caption: "Current chapter visual placeholder.", imageUrl: null },
      { id: "c4-m2", label: "ARTIFACT 02 · COMING SOON", caption: "Recent work preview placeholder.", imageUrl: null },
    ],
    waypoint: { id: "company-04", stop: 1, x: 1085, y: 155 },
  },
];

/* ── CHAPTER 06 · EDUCATION ──────────────────────────────────────────────────── */

export interface EducationEntry {
  id: string;
  index: string;
  institution: string;
  degree: string;
  specialization: string;
  startYear: string;
  graduationYear: string;
  location: string;
  description: string;
  achievements: readonly string[];
  logoUrl: string | null;
}

export const EDUCATION_CONTENT = {
  chapterNumber: "06",
  chapterLabel: "Education",
  heading: "ROOTS BEFORE WINGS.",
} as const;

export const EDUCATION_ENTRIES: readonly EducationEntry[] = [
  {
    id: "edu-01",
    index: "01",
    institution: "Institution Placeholder 01",
    degree: "Degree / Qualification Placeholder",
    specialization: "Specialization / Focus Area Placeholder",
    startYear: "YYYY",
    graduationYear: "YYYY",
    location: "City, Country Placeholder",
    description:
      "Short academic foundation description placeholder. Replace with coursework focus, thesis topic, or research labs once ready.",
    achievements: [
      "Academic highlight placeholder 01",
      "Academic highlight placeholder 02",
    ],
    logoUrl: null,
  },
  {
    id: "edu-02",
    index: "02",
    institution: "Institution Placeholder 02",
    degree: "Earlier Qualification / Secondary Placeholder",
    specialization: "Track / Stream Placeholder",
    startYear: "YYYY",
    graduationYear: "YYYY",
    location: "City, Country Placeholder",
    description:
      "Short description placeholder for foundational studies, early computing interests, or technical communities.",
    achievements: [
      "Foundational highlight placeholder 01",
    ],
    logoUrl: null,
  },
];

/* ── CHAPTER 07 · ACHIEVEMENTS & CERTIFICATIONS ──────────────────────────────── */

export interface RecognitionItem {
  id: string;
  kind: "achievement" | "certification";
  number: string;
  title: string;
  category: string;
  issuer: string;
  year: string;
  description: string;
  verificationUrl: string | null;
  previewLabel: string;
  gallery: readonly {
    id: string;
    label: string;
    imageUrl: string | null;
  }[];
}

export const ACHIEVEMENTS_CONTENT = {
  chapterNumber: "07",
  chapterLabel: "Achievements & Certifications",
  heading: "SMALL VICTORIES. LONG ROADS.",
} as const;

export const ACHIEVEMENTS: readonly RecognitionItem[] = [
  {
    id: "ach-001",
    kind: "achievement",
    number: "001",
    title: "Achievement 001",
    category: "Hackathon / Competition · Placeholder",
    issuer: "Organizer / Organization Placeholder",
    year: "YYYY",
    description:
      "Short achievement description placeholder. Replace with event context, what you built, and verified recognition.",
    verificationUrl: null,
    previewLabel: "ACHIEVEMENT PREVIEW · 001",
    gallery: [
      { id: "a1-1", label: "MEDIA 01 · COMING SOON", imageUrl: null },
      { id: "a1-2", label: "MEDIA 02 · COMING SOON", imageUrl: null },
    ],
  },
  {
    id: "ach-002",
    kind: "achievement",
    number: "002",
    title: "Achievement 002",
    category: "Open-Source / Technical Milestone · Placeholder",
    issuer: "Community / Organization Placeholder",
    year: "YYYY",
    description:
      "Short achievement description placeholder. Replace with contribution details or technical award context.",
    verificationUrl: null,
    previewLabel: "ACHIEVEMENT PREVIEW · 002",
    gallery: [
      { id: "a2-1", label: "MEDIA 01 · COMING SOON", imageUrl: null },
    ],
  },
  {
    id: "ach-003",
    kind: "achievement",
    number: "003",
    title: "Achievement 003",
    category: "Award / Recognition · Placeholder",
    issuer: "Organization Placeholder",
    year: "YYYY",
    description:
      "Short achievement description placeholder. Replace with verified milestone details once ready.",
    verificationUrl: null,
    previewLabel: "ACHIEVEMENT PREVIEW · 003",
    gallery: [
      { id: "a3-1", label: "MEDIA 01 · COMING SOON", imageUrl: null },
    ],
  },
];

export const CERTIFICATIONS: readonly RecognitionItem[] = [
  {
    id: "cert-001",
    kind: "certification",
    number: "001",
    title: "Certificate 001",
    category: "Professional Certification · Placeholder",
    issuer: "Issuing Body Placeholder",
    year: "YYYY",
    description:
      "Short certification description placeholder. Replace with verified credential title, scope, and verification link.",
    verificationUrl: null,
    previewLabel: "CERTIFICATE PREVIEW · 001",
    gallery: [
      { id: "ct1-1", label: "CERTIFICATE SCAN · COMING SOON", imageUrl: null },
    ],
  },
  {
    id: "cert-002",
    kind: "certification",
    number: "002",
    title: "Certificate 002",
    category: "Technical Course Credential · Placeholder",
    issuer: "Issuing Platform Placeholder",
    year: "YYYY",
    description:
      "Short certification description placeholder. Replace with course focus and completed competencies.",
    verificationUrl: null,
    previewLabel: "CERTIFICATE PREVIEW · 002",
    gallery: [
      { id: "ct2-1", label: "CERTIFICATE SCAN · COMING SOON", imageUrl: null },
    ],
  },
  {
    id: "cert-003",
    kind: "certification",
    number: "003",
    title: "Certificate 003",
    category: "Specialization Credential · Placeholder",
    issuer: "Issuing Organization Placeholder",
    year: "YYYY",
    description:
      "Short certification description placeholder. Replace with verified credential details once configured.",
    verificationUrl: null,
    previewLabel: "CERTIFICATE PREVIEW · 003",
    gallery: [
      { id: "ct3-1", label: "CERTIFICATE SCAN · COMING SOON", imageUrl: null },
    ],
  },
];

/* ── CHAPTER 08 · CONTACT & SOCIAL CONFIGURATION ─────────────────────────────── */

export interface SocialLinkConfig {
  id: string;
  label: string;
  url: string | null;
  handlePlaceholder: string;
}

export const CONTACT_CONTENT = {
  chapterNumber: "09",
  chapterLabel: "CONTACT",
  heading: "The story isn't finished.",
  supportingStatement: "Perhaps we could build the next part together.",
  additionalCopy:
    "Have an idea, a question, or something unusual in mind? I'd love to hear it.",
  ctaLabel: "Get in touch",
  email: "ranjanvernekar45@gmail.com",
  name: "Ranjan Vernekar",
  legalLeft: "Ranjan Vernekar — Full-Stack Developer & AI Engineer",
  legalRight: "Built with curiosity. © 2026",
  resumeUrl: null as string | null,
  footerArtwork: {
    realisticBodyUrl: "/assets/footer/realistic-cat-body.webp",
    realisticPawUrl: "/assets/footer/realistic-cat-paw.webp",
    woodblockBodyUrl: "/assets/footer/woodblock-cat-body.webp",
    woodblockPawUrl: "/assets/footer/woodblock-cat-paw.webp",
  },
} as const;

export const SOCIAL_LINKS: readonly SocialLinkConfig[] = [
  {
    id: "email",
    label: "Email",
    url: `mailto:${CONTACT_CONTENT.email}`,
    handlePlaceholder: CONTACT_CONTENT.email,
  },
  {
    id: "github",
    label: "GitHub",
    url: null,
    handlePlaceholder: "Not configured — set URL in portfolio-content.ts",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    url: null,
    handlePlaceholder: "Not configured — set URL in portfolio-content.ts",
  },
  {
    id: "resume",
    label: "Resume",
    url: null,
    handlePlaceholder: "Not configured — link PDF in portfolio-content.ts",
  },
] as const;

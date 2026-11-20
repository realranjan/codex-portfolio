#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "assets", "tech-icons");
const TS_MANIFEST_PATH = path.join(ROOT, "src", "data", "tech-icons-manifest.ts");

const PORTFOLIO_BURGUNDY = "#792B33";
const PORTFOLIO_IVORY = "#F3E9DE";

/**
 * 12 Organized Categories for AI Engineer, Full-Stack Developer & Creative Technologist
 */
const CATEGORIES = [
  { id: "languages", number: "01", title: "Programming Languages", shortTitle: "Languages", summary: "Core statically typed, systems, scripting, and web languages used across production software and AI pipelines." },
  { id: "frontend", number: "02", title: "Frontend & Interactive UI", shortTitle: "Frontend", summary: "Component frameworks, design-token styling, and high-frame-rate web motion libraries." },
  { id: "backend", number: "03", title: "Backend & Runtime", shortTitle: "Backend", summary: "API servers, typed data layers, real-time sockets, and high-throughput service runtimes." },
  { id: "ai-ml", number: "04", title: "AI, Machine Learning & LLMs", shortTitle: "AI / ML / LLMs", summary: "Deep learning frameworks, LLM orchestration, local inference, computer vision, and experiment tracking." },
  { id: "databases", number: "05", title: "Databases & Vector Stores", shortTitle: "Databases", summary: "Relational, document, in-memory, managed BaaS, and vector similarity datastores." },
  { id: "cloud", number: "06", title: "Cloud & DevOps", shortTitle: "Cloud & DevOps", summary: "Containerization, orchestration, cloud platforms, edge delivery, and CI/CD infrastructure." },
  { id: "apis", number: "07", title: "APIs & Service Providers", shortTitle: "APIs & Providers", summary: "Third-party AI model APIs, payments, communications, auth providers, and API tooling." },
  { id: "dev-tools", number: "08", title: "Developer Tools", shortTitle: "Dev Tools", summary: "Version control, editors, package managers, linters, bundlers, and end-to-end testing." },
  { id: "desktop", number: "09", title: "Desktop Engineering", shortTitle: "Desktop", summary: "Cross-platform native and hybrid desktop application frameworks and build systems." },
  { id: "three-d", number: "10", title: "3D & Creative Coding", shortTitle: "3D & Creative", summary: "Real-time WebGL engines, 3D modeling suites, game engines, and generative canvas tools." },
  { id: "design", number: "11", title: "Design & Prototyping", shortTitle: "Design", summary: "Interface design, raster/vector graphics, interactive prototyping, and brand layout tools." },
  { id: "video", number: "12", title: "Video Editing & Motion", shortTitle: "Video & Motion", summary: "Non-linear video editing, compositing, motion graphics, transcoding, and capture suites." },
];

/**
 * Comprehensive branded technology inventory (zero duplicates; zero non-branded concepts).
 * Each entry specifies preferred authentic upstream sources in priority order:
 * - { type: "devicon", name: "<slug>" } -> https://api.iconify.design/devicon/<slug>.svg
 * - { type: "logos", name: "<slug>" } -> https://api.iconify.design/logos/<slug>.svg
 * - { type: "simple-icons", name: "<slug>" } -> https://api.iconify.design/simple-icons/<slug>.svg (colored with verified official brand hex)
 */
const TECH_INVENTORY = [
  // 01. Programming Languages
  { slug: "python", name: "Python", category: "languages", brandColor: "#3776AB", sources: [{ type: "devicon", name: "python" }, { type: "logos", name: "python" }] },
  { slug: "typescript", name: "TypeScript", category: "languages", brandColor: "#3178C6", sources: [{ type: "devicon", name: "typescript" }, { type: "logos", name: "typescript-icon" }] },
  { slug: "javascript", name: "JavaScript", category: "languages", brandColor: "#F7DF1E", sources: [{ type: "devicon", name: "javascript" }, { type: "logos", name: "javascript" }] },
  { slug: "rust", name: "Rust", category: "languages", brandColor: "#000000", isDarkMark: true, sources: [{ type: "simple-icons", name: "rust" }, { type: "logos", name: "rust" }] },
  { slug: "go", name: "Go", category: "languages", brandColor: "#00ADD8", sources: [{ type: "devicon", name: "go-wordmark" }, { type: "logos", name: "go" }, { type: "devicon", name: "go" }] },
  { slug: "cpp", name: "C++", category: "languages", brandColor: "#00599C", sources: [{ type: "devicon", name: "cplusplus" }, { type: "logos", name: "c-plusplus" }] },
  { slug: "c", name: "C", category: "languages", brandColor: "#A8B9CC", sources: [{ type: "devicon", name: "c" }, { type: "logos", name: "c" }] },
  { slug: "java", name: "Java", category: "languages", brandColor: "#ED8B00", sources: [{ type: "devicon", name: "java" }, { type: "logos", name: "java" }] },
  { slug: "html5", name: "HTML5", category: "languages", brandColor: "#E34F26", sources: [{ type: "devicon", name: "html5" }, { type: "logos", name: "html-5" }] },
  { slug: "css3", name: "CSS3", category: "languages", brandColor: "#1572B6", sources: [{ type: "devicon", name: "css3" }, { type: "logos", name: "css-3" }] },
  { slug: "bash", name: "Bash", category: "languages", brandColor: "#4EAA25", isDarkMark: true, sources: [{ type: "devicon", name: "bash" }, { type: "simple-icons", name: "gnubash" }] },

  // 02. Frontend
  { slug: "react", name: "React", category: "frontend", brandColor: "#61DAFB", sources: [{ type: "devicon", name: "react" }, { type: "logos", name: "react" }] },
  { slug: "nextjs", name: "Next.js", category: "frontend", brandColor: "#000000", isDarkMark: true, sources: [{ type: "devicon", name: "nextjs" }, { type: "simple-icons", name: "nextdotjs" }] },
  { slug: "vuejs", name: "Vue.js", category: "frontend", brandColor: "#4FC08D", sources: [{ type: "devicon", name: "vuejs" }, { type: "logos", name: "vue" }] },
  { slug: "svelte", name: "Svelte", category: "frontend", brandColor: "#FF3E00", sources: [{ type: "devicon", name: "svelte" }, { type: "logos", name: "svelte-icon" }] },
  { slug: "tailwindcss", name: "Tailwind CSS", category: "frontend", brandColor: "#06B6D4", sources: [{ type: "devicon", name: "tailwindcss" }, { type: "logos", name: "tailwindcss-icon" }] },
  { slug: "vite", name: "Vite", category: "frontend", brandColor: "#646CFF", sources: [{ type: "devicon", name: "vitejs" }, { type: "logos", name: "vitejs" }] },
  { slug: "gsap", name: "GSAP", category: "frontend", brandColor: "#88CE02", sources: [{ type: "logos", name: "greensock-icon" }, { type: "simple-icons", name: "greensock" }] },
  { slug: "motion", name: "Motion (Framer)", category: "frontend", brandColor: "#0055FF", isDarkMark: true, sources: [{ type: "devicon", name: "framermotion" }, { type: "simple-icons", name: "framer" }] },
  { slug: "sass", name: "Sass", category: "frontend", brandColor: "#CC6699", sources: [{ type: "devicon", name: "sass" }, { type: "logos", name: "sass" }] },
  { slug: "redux", name: "Redux", category: "frontend", brandColor: "#764ABC", sources: [{ type: "devicon", name: "redux" }, { type: "logos", name: "redux" }] },

  // 03. Backend
  { slug: "nodejs", name: "Node.js", category: "backend", brandColor: "#5FA04E", sources: [{ type: "devicon", name: "nodejs" }, { type: "logos", name: "nodejs-icon" }] },
  { slug: "express", name: "Express", category: "backend", brandColor: "#000000", isDarkMark: true, sources: [{ type: "simple-icons", name: "express" }, { type: "devicon", name: "express" }] },
  { slug: "fastapi", name: "FastAPI", category: "backend", brandColor: "#009688", sources: [{ type: "devicon", name: "fastapi" }, { type: "logos", name: "fastapi-icon" }] },
  { slug: "django", name: "Django", category: "backend", brandColor: "#092E20", isDarkMark: true, sources: [{ type: "devicon", name: "django-plain" }, { type: "logos", name: "django-icon" }, { type: "simple-icons", name: "django" }] },
  { slug: "flask", name: "Flask", category: "backend", brandColor: "#000000", isDarkMark: true, sources: [{ type: "simple-icons", name: "flask" }, { type: "devicon", name: "flask" }] },
  { slug: "nestjs", name: "NestJS", category: "backend", brandColor: "#E0234E", sources: [{ type: "devicon", name: "nestjs" }, { type: "logos", name: "nestjs" }] },
  { slug: "graphql", name: "GraphQL", category: "backend", brandColor: "#E10098", sources: [{ type: "devicon", name: "graphql" }, { type: "logos", name: "graphql" }] },
  { slug: "prisma", name: "Prisma", category: "backend", brandColor: "#2D3748", isDarkMark: true, sources: [{ type: "devicon", name: "prisma" }, { type: "simple-icons", name: "prisma" }] },
  { slug: "socketio", name: "Socket.IO", category: "backend", brandColor: "#010101", isDarkMark: true, sources: [{ type: "simple-icons", name: "socketdotio" }, { type: "logos", name: "socket-io" }] },

  // 04. AI / ML / LLMs
  { slug: "pytorch", name: "PyTorch", category: "ai-ml", brandColor: "#EE4C2C", sources: [{ type: "devicon", name: "pytorch" }, { type: "logos", name: "pytorch-icon" }] },
  { slug: "tensorflow", name: "TensorFlow", category: "ai-ml", brandColor: "#FF6F00", sources: [{ type: "devicon", name: "tensorflow" }, { type: "logos", name: "tensorflow" }] },
  { slug: "huggingface", name: "Hugging Face", category: "ai-ml", brandColor: "#FFD21E", sources: [{ type: "logos", name: "hugging-face-icon" }, { type: "simple-icons", name: "huggingface" }] },
  { slug: "langchain", name: "LangChain", category: "ai-ml", brandColor: "#1C3C3C", isDarkMark: true, sources: [{ type: "simple-icons", name: "langchain" }] },
  { slug: "scikitlearn", name: "scikit-learn", category: "ai-ml", brandColor: "#F7931E", sources: [{ type: "devicon", name: "scikitlearn" }, { type: "simple-icons", name: "scikitlearn" }] },
  { slug: "numpy", name: "NumPy", category: "ai-ml", brandColor: "#013243", sources: [{ type: "devicon", name: "numpy" }, { type: "logos", name: "numpy" }] },
  { slug: "pandas", name: "Pandas", category: "ai-ml", brandColor: "#150458", isDarkMark: true, sources: [{ type: "devicon", name: "pandas" }, { type: "logos", name: "pandas-icon" }] },
  { slug: "opencv", name: "OpenCV", category: "ai-ml", brandColor: "#5C3EE8", sources: [{ type: "devicon", name: "opencv" }, { type: "logos", name: "opencv" }] },
  { slug: "ollama", name: "Ollama", category: "ai-ml", brandColor: "#000000", isDarkMark: true, sources: [{ type: "simple-icons", name: "ollama" }] },
  { slug: "jupyter", name: "Jupyter", category: "ai-ml", brandColor: "#F37626", sources: [{ type: "devicon", name: "jupyter" }, { type: "logos", name: "jupyter" }] },
  { slug: "wandb", name: "Weights & Biases", category: "ai-ml", brandColor: "#FFBE00", sources: [{ type: "simple-icons", name: "weightsandbiases" }] },
  { slug: "keras", name: "Keras", category: "ai-ml", brandColor: "#D00000", sources: [{ type: "devicon", name: "keras" }, { type: "simple-icons", name: "keras" }] },

  // 05. Databases & Vector Stores
  { slug: "postgresql", name: "PostgreSQL", category: "databases", brandColor: "#4169E1", sources: [{ type: "devicon", name: "postgresql" }, { type: "logos", name: "postgresql" }] },
  { slug: "mongodb", name: "MongoDB", category: "databases", brandColor: "#47A248", sources: [{ type: "devicon", name: "mongodb" }, { type: "logos", name: "mongodb-icon" }] },
  { slug: "redis", name: "Redis", category: "databases", brandColor: "#FF4438", sources: [{ type: "devicon", name: "redis" }, { type: "logos", name: "redis" }] },
  { slug: "supabase", name: "Supabase", category: "databases", brandColor: "#3FCF8E", sources: [{ type: "devicon", name: "supabase" }, { type: "logos", name: "supabase-icon" }] },
  { slug: "firebase", name: "Firebase", category: "databases", brandColor: "#DD2C00", sources: [{ type: "devicon", name: "firebase" }, { type: "logos", name: "firebase-icon" }] },
  { slug: "sqlite", name: "SQLite", category: "databases", brandColor: "#003B57", sources: [{ type: "devicon", name: "sqlite" }, { type: "logos", name: "sqlite" }] },
  { slug: "mysql", name: "MySQL", category: "databases", brandColor: "#4479A1", sources: [{ type: "devicon", name: "mysql" }, { type: "logos", name: "mysql-icon" }] },
  { slug: "pinecone", name: "Pinecone", category: "databases", brandColor: "#000000", isDarkMark: true, sources: [{ type: "logos", name: "pinecone-icon" }, { type: "simple-icons", name: "pinecone" }] },
  { slug: "qdrant", name: "Qdrant", category: "databases", brandColor: "#DC244C", sources: [{ type: "logos", name: "qdrant-icon" }, { type: "simple-icons", name: "qdrant" }] },

  // 06. Cloud & DevOps
  { slug: "aws", name: "AWS", category: "cloud", brandColor: "#FF9900", isDarkMark: true, sources: [{ type: "devicon", name: "amazonwebservices-wordmark" }, { type: "logos", name: "aws" }] },
  { slug: "gcp", name: "Google Cloud", category: "cloud", brandColor: "#4285F4", sources: [{ type: "devicon", name: "googlecloud" }, { type: "logos", name: "google-cloud" }] },
  { slug: "docker", name: "Docker", category: "cloud", brandColor: "#2496ED", sources: [{ type: "devicon", name: "docker" }, { type: "logos", name: "docker-icon" }] },
  { slug: "kubernetes", name: "Kubernetes", category: "cloud", brandColor: "#326CE5", sources: [{ type: "devicon", name: "kubernetes" }, { type: "logos", name: "kubernetes" }] },
  { slug: "vercel", name: "Vercel", category: "cloud", brandColor: "#000000", isDarkMark: true, sources: [{ type: "simple-icons", name: "vercel" }, { type: "logos", name: "vercel-icon" }] },
  { slug: "cloudflare", name: "Cloudflare", category: "cloud", brandColor: "#F38020", sources: [{ type: "devicon", name: "cloudflare" }, { type: "logos", name: "cloudflare-icon" }] },
  { slug: "githubactions", name: "GitHub Actions", category: "cloud", brandColor: "#2088FF", sources: [{ type: "devicon", name: "githubactions" }, { type: "logos", name: "github-actions" }] },
  { slug: "nginx", name: "Nginx", category: "cloud", brandColor: "#009639", sources: [{ type: "devicon", name: "nginx" }, { type: "logos", name: "nginx" }] },
  { slug: "linux", name: "Linux", category: "cloud", brandColor: "#FCC624", isDarkMark: true, sources: [{ type: "devicon", name: "linux" }, { type: "logos", name: "linux-tux" }] },

  // 07. APIs & Service Providers
  { slug: "openai", name: "OpenAI", category: "apis", brandColor: "#10A37F", isDarkMark: true, sources: [{ type: "logos", name: "openai-icon" }, { type: "simple-icons", name: "openai" }] },
  { slug: "anthropic", name: "Anthropic", category: "apis", brandColor: "#191919", isDarkMark: true, sources: [{ type: "simple-icons", name: "anthropic" }, { type: "logos", name: "anthropic-icon" }] },
  { slug: "gemini", name: "Google Gemini", category: "apis", brandColor: "#8E75B2", sources: [{ type: "logos", name: "google-gemini" }, { type: "simple-icons", name: "googlegemini" }] },
  { slug: "mistral", name: "Mistral AI", category: "apis", brandColor: "#FA520F", sources: [{ type: "logos", name: "mistral-ai-icon" }, { type: "simple-icons", name: "mistralai" }] },
  { slug: "stripe", name: "Stripe", category: "apis", brandColor: "#635BFF", sources: [{ type: "logos", name: "stripe" }, { type: "simple-icons", name: "stripe" }] },
  { slug: "twilio", name: "Twilio", category: "apis", brandColor: "#F22F46", sources: [{ type: "logos", name: "twilio-icon" }, { type: "simple-icons", name: "twilio" }] },
  { slug: "postman", name: "Postman", category: "apis", brandColor: "#FF6C37", sources: [{ type: "devicon", name: "postman" }, { type: "logos", name: "postman-icon" }] },
  { slug: "openapi", name: "OpenAPI / Swagger", category: "apis", brandColor: "#85EA2D", sources: [{ type: "devicon", name: "swagger" }, { type: "logos", name: "swagger" }, { type: "simple-icons", name: "openapiinitiative" }] },
  { slug: "auth0", name: "Auth0", category: "apis", brandColor: "#EB5424", sources: [{ type: "logos", name: "auth0-icon" }, { type: "simple-icons", name: "auth0" }] },

  // 08. Developer Tools
  { slug: "git", name: "Git", category: "dev-tools", brandColor: "#F05032", sources: [{ type: "devicon", name: "git" }, { type: "logos", name: "git-icon" }] },
  { slug: "github", name: "GitHub", category: "dev-tools", brandColor: "#181717", isDarkMark: true, sources: [{ type: "simple-icons", name: "github" }, { type: "devicon", name: "github" }] },
  { slug: "vscode", name: "VS Code", category: "dev-tools", brandColor: "#007ACC", sources: [{ type: "devicon", name: "vscode" }, { type: "logos", name: "visual-studio-code" }] },
  { slug: "neovim", name: "Neovim", category: "dev-tools", brandColor: "#57A143", sources: [{ type: "devicon", name: "neovim" }, { type: "logos", name: "neovim" }] },
  { slug: "pnpm", name: "pnpm", category: "dev-tools", brandColor: "#F69220", sources: [{ type: "devicon", name: "pnpm" }, { type: "logos", name: "pnpm" }] },
  { slug: "npm", name: "npm", category: "dev-tools", brandColor: "#CB3837", sources: [{ type: "devicon", name: "npm-wordmark" }, { type: "logos", name: "npm-icon" }] },
  { slug: "webpack", name: "Webpack", category: "dev-tools", brandColor: "#8DD6F9", sources: [{ type: "devicon", name: "webpack" }, { type: "logos", name: "webpack" }] },
  { slug: "eslint", name: "ESLint", category: "dev-tools", brandColor: "#4B32C3", sources: [{ type: "devicon", name: "eslint" }, { type: "logos", name: "eslint" }] },
  { slug: "playwright", name: "Playwright", category: "dev-tools", brandColor: "#2EAD33", sources: [{ type: "devicon", name: "playwright" }, { type: "logos", name: "playwright" }] },

  // 09. Desktop Engineering
  { slug: "electron", name: "Electron", category: "desktop", brandColor: "#47848F", sources: [{ type: "devicon", name: "electron" }, { type: "logos", name: "electron" }] },
  { slug: "tauri", name: "Tauri", category: "desktop", brandColor: "#FFC131", sources: [{ type: "devicon", name: "tauri" }, { type: "logos", name: "tauri" }] },
  { slug: "qt", name: "Qt", category: "desktop", brandColor: "#41CD52", sources: [{ type: "devicon", name: "qt" }, { type: "logos", name: "qt" }] },
  { slug: "flutter", name: "Flutter", category: "desktop", brandColor: "#02569B", sources: [{ type: "devicon", name: "flutter" }, { type: "logos", name: "flutter" }] },
  { slug: "dotnet", name: ".NET", category: "desktop", brandColor: "#512BD4", sources: [{ type: "devicon", name: "dotnetcore" }, { type: "logos", name: "dotnet" }] },
  { slug: "cmake", name: "CMake", category: "desktop", brandColor: "#064F8C", sources: [{ type: "devicon", name: "cmake" }, { type: "simple-icons", name: "cmake" }] },

  // 10. 3D & Creative Coding
  { slug: "threejs", name: "Three.js", category: "three-d", brandColor: "#000000", isDarkMark: true, sources: [{ type: "devicon", name: "threejs" }, { type: "simple-icons", name: "threedotjs" }] },
  { slug: "blender", name: "Blender", category: "three-d", brandColor: "#E87D0D", sources: [{ type: "devicon", name: "blender" }, { type: "logos", name: "blender" }] },
  { slug: "unity", name: "Unity", category: "three-d", brandColor: "#000000", isDarkMark: true, sources: [{ type: "devicon", name: "unity" }, { type: "simple-icons", name: "unity" }] },
  { slug: "unrealengine", name: "Unreal Engine", category: "three-d", brandColor: "#0E1128", isDarkMark: true, sources: [{ type: "devicon", name: "unrealengine" }, { type: "simple-icons", name: "unrealengine" }] },
  { slug: "webgl", name: "WebGL", category: "three-d", brandColor: "#990000", sources: [{ type: "logos", name: "webgl" }, { type: "simple-icons", name: "webgl" }] },
  { slug: "godot", name: "Godot", category: "three-d", brandColor: "#478CBF", sources: [{ type: "devicon", name: "godot" }, { type: "logos", name: "godot-icon" }] },
  { slug: "p5js", name: "p5.js", category: "three-d", brandColor: "#ED225D", sources: [{ type: "devicon", name: "p5js" }, { type: "simple-icons", name: "p5dotjs" }] },

  // 11. Design
  { slug: "figma", name: "Figma", category: "design", brandColor: "#F24E1E", sources: [{ type: "devicon", name: "figma" }, { type: "logos", name: "figma" }] },
  { slug: "photoshop", name: "Adobe Photoshop", category: "design", brandColor: "#31A8FF", sources: [{ type: "devicon", name: "photoshop" }, { type: "logos", name: "adobe-photoshop" }] },
  { slug: "illustrator", name: "Adobe Illustrator", category: "design", brandColor: "#FF9A00", sources: [{ type: "devicon", name: "illustrator" }, { type: "logos", name: "adobe-illustrator" }] },
  { slug: "adobexd", name: "Adobe XD", category: "design", brandColor: "#FF61F6", sources: [{ type: "devicon", name: "xd" }, { type: "logos", name: "adobe-xd" }] },
  { slug: "framer", name: "Framer", category: "design", brandColor: "#0055FF", isDarkMark: true, sources: [{ type: "logos", name: "framer" }, { type: "simple-icons", name: "framer" }] },
  { slug: "canva", name: "Canva", category: "design", brandColor: "#00C4CC", sources: [{ type: "devicon", name: "canva" }, { type: "simple-icons", name: "canva" }] },

  // 12. Video Editing & Motion
  { slug: "premierepro", name: "Adobe Premiere Pro", category: "video", brandColor: "#9999FF", sources: [{ type: "devicon", name: "premierepro" }, { type: "logos", name: "adobe-premiere" }] },
  { slug: "aftereffects", name: "Adobe After Effects", category: "video", brandColor: "#9999FF", sources: [{ type: "devicon", name: "aftereffects" }, { type: "logos", name: "adobe-after-effects" }] },
  { slug: "davinciresolve", name: "DaVinci Resolve", category: "video", brandColor: "#233A51", sources: [{ type: "simple-icons", name: "davinciresolve" }] },
  { slug: "ffmpeg", name: "FFmpeg", category: "video", brandColor: "#007808", sources: [{ type: "simple-icons", name: "ffmpeg" }] },
  { slug: "obsstudio", name: "OBS Studio", category: "video", brandColor: "#302E31", isDarkMark: true, sources: [{ type: "simple-icons", name: "obsstudio" }] },
];

/**
 * Separate Text-Label Manifest for Engineering Concepts, Protocols & Standards
 * that do NOT have official trademark brand logos (Requirement 6 & 8).
 */
const TECH_CONCEPTS = [
  { slug: "rest", label: "REST", kind: "protocol", category: "apis", summary: "Resource-oriented HTTP API architecture and stateless contract design.", hasBrandLogo: false },
  { slug: "oauth", label: "OAuth 2.0", kind: "protocol", category: "apis", summary: "Delegated token authorization, PKCE flows, and identity federation.", hasBrandLogo: false },
  { slug: "websockets", label: "WebSockets", kind: "protocol", category: "backend", summary: "Full-duplex low-latency bidirectional messaging over persistent TCP.", hasBrandLogo: false },
  { slug: "sse", label: "Server-Sent Events", kind: "protocol", category: "apis", summary: "Streaming token and live telemetry delivery over HTTP.", hasBrandLogo: false },
  { slug: "webrtc", label: "WebRTC", kind: "protocol", category: "backend", summary: "Real-time peer-to-peer audio, video, and low-latency data channels.", hasBrandLogo: false },
  { slug: "rag", label: "RAG", kind: "concept", category: "ai-ml", summary: "Retrieval-Augmented Generation grounding LLMs with hybrid vector/keyword search.", hasBrandLogo: false },
  { slug: "nlp", label: "NLP", kind: "concept", category: "ai-ml", summary: "Natural language parsing, tokenization, semantic extraction, and classification.", hasBrandLogo: false },
  { slug: "agentic-workflows", label: "Agentic Workflows", kind: "concept", category: "ai-ml", summary: "Tool-calling loops, structured output routing, and deterministic verification.", hasBrandLogo: false },
  { slug: "fine-tuning-lora", label: "Fine-Tuning & LoRA", kind: "concept", category: "ai-ml", summary: "Parameter-efficient domain adaptation and synthetic dataset curation.", hasBrandLogo: false },
  { slug: "vector-embeddings", label: "Vector Embeddings", kind: "concept", category: "ai-ml", summary: "Dense semantic indexing, chunking strategies, and cosine similarity reranking.", hasBrandLogo: false },
  { slug: "prompt-engineering", label: "Prompt Engineering", kind: "concept", category: "ai-ml", summary: "Structured system specifications, evaluation harnesses, and rubric scoring.", hasBrandLogo: false },
  { slug: "sql", label: "SQL", kind: "standard", category: "languages", summary: "Relational query language, CTEs, window functions, and schema indexing.", hasBrandLogo: false },
  { slug: "glsl", label: "GLSL Shaders", kind: "standard", category: "three-d", summary: "Custom vertex and fragment shaders for procedural surfaces and post-processing.", hasBrandLogo: false },
  { slug: "ssr-rsc", label: "SSR & Server Components", kind: "architecture", category: "frontend", summary: "Streaming server rendering, edge caching, and lean client bundles.", hasBrandLogo: false },
  { slug: "ci-cd", label: "CI / CD", kind: "architecture", category: "cloud", summary: "Automated lint, test, container build, and zero-downtime deployment pipelines.", hasBrandLogo: false },
  { slug: "microservices", label: "Microservices", kind: "architecture", category: "backend", summary: "Bounded service decomposition, async queues, and resilient fault isolation.", hasBrandLogo: false },
  { slug: "wcag", label: "Accessibility (WCAG)", kind: "standard", category: "frontend", summary: "Keyboard navigation, semantic landmarks, contrast ratios, and reduced motion.", hasBrandLogo: false },
];

function parseSvgViewBox(svg) {
  const vbMatch = svg.match(/\bviewBox\s*=\s*["']([^"']+)["']/i);
  if (vbMatch) {
    const nums = vbMatch[1].trim().split(/[\s,]+/).map(Number.parseFloat);
    if (nums.length === 4 && nums.every(Number.isFinite) && nums[2] > 0 && nums[3] > 0) {
      return { minX: nums[0], minY: nums[1], width: nums[2], height: nums[3] };
    }
  }
  const openTagMatch = svg.match(/<svg\b[^>]*>/i);
  if (!openTagMatch) return null;
  const openTag = openTagMatch[0];
  const wMatch = openTag.match(/\bwidth\s*=\s*["']([\d.]+)(?:px)?["']/i);
  const hMatch = openTag.match(/\bheight\s*=\s*["']([\d.]+)(?:px)?["']/i);
  if (wMatch && hMatch) {
    const width = Number.parseFloat(wMatch[1]);
    const height = Number.parseFloat(hMatch[1]);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { minX: 0, minY: 0, width, height };
    }
  }
  return null;
}

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function normalizeSvgAsset(rawSvg, { targetSize = 64, padding = 4, monochromeFill } = {}) {
  const vb = parseSvgViewBox(rawSvg);
  if (!vb) throw new Error("Missing valid viewBox");

  const openTagMatch = rawSvg.match(/<svg\b[^>]*>/i);
  const closeIdx = rawSvg.toLowerCase().lastIndexOf("</svg>");
  if (!openTagMatch || closeIdx === -1) throw new Error("Malformed SVG");

  const openTagEnd = (openTagMatch.index ?? 0) + openTagMatch[0].length;
  let inner = rawSvg.slice(openTagEnd, closeIdx).trim();
  inner = inner.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").trim();

  if (monochromeFill) {
    inner = inner.replace(/\bfill\s*=\s*["']currentColor["']/gi, `fill="${monochromeFill}"`);
    inner = inner.replace(/\bstroke\s*=\s*["']currentColor["']/gi, `stroke="${monochromeFill}"`);
  }

  const innerBox = Math.max(1, targetSize - padding * 2);
  const scale = Math.min(innerBox / vb.width, innerBox / vb.height);
  const scaledW = vb.width * scale;
  const scaledH = vb.height * scale;
  const tx = (targetSize - scaledW) / 2 - vb.minX * scale;
  const ty = (targetSize - scaledH) / 2 - vb.minY * scale;

  const transform = `translate(${round4(tx)} ${round4(ty)}) scale(${round4(scale)})`;
  const groupFillAttr =
    monochromeFill && !/\bfill\s*=/i.test(inner) ? ` fill="${monochromeFill}"` : "";
  const needsXlink = /\bxlink:href\b/i.test(inner);
  const xlinkAttr = needsXlink ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg"${xlinkAttr} viewBox="0 0 ${targetSize} ${targetSize}" width="${targetSize}" height="${targetSize}">`,
    `  <g transform="${transform}"${groupFillAttr}>`,
    `    ${inner}`,
    `  </g>`,
    `</svg>`,
    "",
  ].join("\n");
}

function hexToLum(hex) {
  const clean = hex.replace(/^#/, "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(a, b) {
  const l1 = hexToLum(a);
  const l2 = hexToLum(b);
  return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
}

async function fetchSimpleIconsColors() {
  try {
    const res = await fetch("https://cdn.jsdelivr.net/npm/simple-icons@latest/_data/simple-icons.json");
    if (!res.ok) return new Map();
    const json = await res.json();
    const list = Array.isArray(json) ? json : json.icons ?? [];
    const map = new Map();
    for (const item of list) {
      if (item.slug && item.hex) map.set(item.slug.toLowerCase(), `#${item.hex.toUpperCase()}`);
      if (item.title && item.hex) {
        const norm = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
        map.set(norm, `#${item.hex.toUpperCase()}`);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

async function fetchIconifyBulk(prefix, names) {
  const unique = [...new Set(names)];
  const map = new Map();
  if (unique.length === 0) return map;
  const chunkSize = 35;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const url = `https://api.iconify.design/${prefix}.json?icons=${encodeURIComponent(chunk.join(","))}`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const defW = json.width ?? 256;
      const defH = json.height ?? 256;
      for (const [iconName, iconData] of Object.entries(json.icons ?? {})) {
        const w = iconData.width ?? defW;
        const h = iconData.height ?? defH;
        const left = iconData.left ?? 0;
        const top = iconData.top ?? 0;
        const body = iconData.body;
        if (body) {
          map.set(
            iconName,
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${w} ${h}">${body}</svg>`
          );
        }
      }
    } catch {
      // continue to fallback sources
    }
  }
  return map;
}

async function fetchCandidate(source, fallbackHex, simpleIconsColors, bulkCaches) {
  let rawSvg = null;
  let sourceLabel = "";
  let monochromeFill = undefined;

  if (source.type === "devicon") {
    // 1. Check Iconify devicon bulk cache first (already resolved exact multi-color SVG!)
    const cached = bulkCaches.devicon.get(source.name);
    if (cached) {
      rawSvg = cached;
      sourceLabel = `Devicon (Iconify: devicon:${source.name})`;
    } else {
      // 2. Direct jsDelivr Devicon CDN fallback
      const base = source.name.replace(/-(plain|wordmark|original)$/, "");
      const variant = source.name.endsWith("-plain")
        ? "plain"
        : source.name.endsWith("-wordmark")
          ? "original-wordmark"
          : "original";
      const url = `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${base}/${base}-${variant}.svg`;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const text = (await res.text()).trim();
          if (text.startsWith("<svg")) {
            rawSvg = text;
            sourceLabel = `Devicon (${base}-${variant}.svg)`;
          }
        }
      } catch {
        // ignore
      }
    }
  } else if (source.type === "logos") {
    const cached = bulkCaches.logos.get(source.name);
    if (cached) {
      rawSvg = cached;
      sourceLabel = `SVG Logos (Iconify: logos:${source.name})`;
    }
  } else if (source.type === "simple-icons") {
    const officialHex = simpleIconsColors.get(source.name.toLowerCase()) || fallbackHex;
    monochromeFill = officialHex;
    const cached = bulkCaches.simpleIcons.get(source.name);
    if (cached) {
      rawSvg = cached;
      sourceLabel = `Simple Icons (simple-icons:${source.name})`;
    } else {
      const url = `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${source.name}.svg`;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const text = (await res.text()).trim();
          if (text.startsWith("<svg")) {
            rawSvg = text;
            sourceLabel = `Simple Icons (${source.name}.svg)`;
          }
        }
      } catch {
        // ignore
      }
    }
  }

  if (!rawSvg) return null;
  const trimmed = rawSvg.trim();
  if (!trimmed.startsWith("<svg") || !trimmed.toLowerCase().endsWith("</svg>")) return null;

  const usesCurrentColorOnly =
    /currentColor/i.test(trimmed) && !/#[0-9a-fA-F]{3,6}/.test(trimmed) && !/rgb\(/i.test(trimmed);
  const effectiveFill = monochromeFill || (usesCurrentColorOnly ? fallbackHex : undefined);

  try {
    const normalized = normalizeSvgAsset(trimmed, {
      targetSize: 64,
      padding: 4,
      monochromeFill: effectiveFill,
    });
    return {
      svg: normalized,
      source: sourceLabel,
      resolvedBrandColor: effectiveFill || fallbackHex,
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log("Fetching Simple Icons official hex catalog + Iconify bulk packs...");
  const deviconNames = [];
  const logosNames = [];
  const simpleIconsNames = [];
  for (const item of TECH_INVENTORY) {
    for (const s of item.sources) {
      if (s.type === "devicon") deviconNames.push(s.name);
      else if (s.type === "logos") logosNames.push(s.name);
      else if (s.type === "simple-icons") simpleIconsNames.push(s.name);
    }
  }

  const [simpleIconsColors, deviconMap, logosMap, simpleIconsMap] = await Promise.all([
    fetchSimpleIconsColors(),
    fetchIconifyBulk("devicon", deviconNames),
    fetchIconifyBulk("logos", logosNames),
    fetchIconifyBulk("simple-icons", simpleIconsNames),
  ]);

  const bulkCaches = {
    devicon: deviconMap,
    logos: logosMap,
    simpleIcons: simpleIconsMap,
  };

  console.log(
    `Loaded catalogs -> SimpleIcons hex: ${simpleIconsColors.size}, devicon: ${deviconMap.size}, logos: ${logosMap.size}, simple-icons: ${simpleIconsMap.size}`
  );

  // Clean & prepare organized category directories
  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const cat of CATEGORIES) {
    await fs.mkdir(path.join(OUT_DIR, cat.id), { recursive: true });
  }

  // Enforce deduplication before fetching
  const seenSlugs = new Set();
  for (const item of TECH_INVENTORY) {
    if (seenSlugs.has(item.slug)) {
      throw new Error(`Duplicate slug in TECH_INVENTORY: ${item.slug}`);
    }
    seenSlugs.add(item.slug);
  }

  const results = [];
  const missing = [];

  for (const item of TECH_INVENTORY) {
    let fetched = null;
    for (const src of item.sources) {
      fetched = await fetchCandidate(src, item.brandColor, simpleIconsColors, bulkCaches);
      if (fetched) break;
    }

    const relPath = `/assets/tech-icons/${item.category}/${item.slug}.svg`;
    const absPath = path.join(OUT_DIR, item.category, `${item.slug}.svg`);

    if (!fetched) {
      missing.push({ slug: item.slug, name: item.name, category: item.category });
      results.push({
        slug: item.slug,
        name: item.name,
        category: item.category,
        iconFile: relPath,
        brandColor: item.brandColor,
        source: "UNVERIFIED — Missing upstream official SVG",
        verified: false,
        contrastOnBurgundy: contrastRatio(item.brandColor, PORTFOLIO_BURGUNDY),
        contrastOnIvory: contrastRatio(item.brandColor, PORTFOLIO_IVORY),
        burgundyPlate: "ivory-plate",
        ivoryPlate: "transparent",
      });
      continue;
    }

    await fs.writeFile(absPath, fetched.svg, "utf8");

    const brandHex = item.brandColor.toUpperCase();
    const cBurgundy = contrastRatio(brandHex, PORTFOLIO_BURGUNDY);
    const cIvory = contrastRatio(brandHex, PORTFOLIO_IVORY);
    const burgundyPlate = item.isDarkMark || cBurgundy < 2.6 ? "ivory-plate" : "transparent";
    const ivoryPlate = cIvory < 1.85 ? "burgundy-plate" : "transparent";

    results.push({
      slug: item.slug,
      name: item.name,
      category: item.category,
      iconFile: relPath,
      brandColor: brandHex,
      source: fetched.source,
      verified: true,
      contrastOnBurgundy: cBurgundy,
      contrastOnIvory: cIvory,
      burgundyPlate,
      ivoryPlate,
    });
  }

  const verifiedCount = results.filter((r) => r.verified).length;
  const unverifiedCount = results.length - verifiedCount;

  // Write portable JSON manifests into /public/assets/tech-icons/
  await fs.writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify({ categories: CATEGORIES, icons: results }, null, 2) + "\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(OUT_DIR, "concepts-manifest.json"),
    JSON.stringify({ concepts: TECH_CONCEPTS }, null, 2) + "\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(OUT_DIR, "audit-report.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalIcons: results.length,
        verifiedCount,
        unverifiedCount,
        totalConcepts: TECH_CONCEPTS.length,
        categoriesCount: CATEGORIES.length,
        missing,
        surfaceRules: {
          burgundy: PORTFOLIO_BURGUNDY,
          ivory: PORTFOLIO_IVORY,
          ivoryPlateOnBurgundyCount: results.filter((r) => r.burgundyPlate === "ivory-plate").length,
          burgundyPlateOnIvoryCount: results.filter((r) => r.ivoryPlate === "burgundy-plate").length,
        },
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  // Write clean, typed, editable TypeScript manifest in /src/data/tech-icons-manifest.ts
  const tsFile = `/**
 * EDITABLE TECHNOLOGY ICON & CONCEPT MANIFEST
 * -----------------------------------------------------------------------------
 * Complete, brand-accurate, colored SVG technology icon library for:
 * AI Engineer · Full-Stack Developer · Creative Technologist.
 *
 * - Every verified icon points to an individual, normalized 64x64 transparent
 *   SVG file under \`/public/assets/tech-icons/<category>/<slug>.svg\`.
 * - Official logo geometry and brand colors are preserved from authentic
 *   upstream libraries (Devicon, SVG Logos / Iconify, Simple Icons).
 * - Engineering concepts, protocols, and standards without official trademark
 *   logos live strictly in \`TECH_CONCEPTS_MANIFEST\` (zero invented icons).
 * - Contrast profiles (\`burgundyPlate\` / \`ivoryPlate\`) ensure every mark is
 *   crisp over both Burgundy (#792B33) and Warm Ivory (#F3E9DE).
 */

import type { IconSurfacePlate } from "@/lib/tech-icon-utils";

export type TechCategoryId =
  | "languages"
  | "frontend"
  | "backend"
  | "ai-ml"
  | "databases"
  | "cloud"
  | "apis"
  | "dev-tools"
  | "desktop"
  | "three-d"
  | "design"
  | "video";

export interface TechIconCategory {
  id: TechCategoryId;
  number: string;
  title: string;
  shortTitle: string;
  summary: string;
}

export interface TechIconEntry {
  slug: string;
  name: string;
  category: TechCategoryId;
  iconFile: string;
  brandColor: string;
  source: string;
  verified: boolean;
  contrastOnBurgundy: number;
  contrastOnIvory: number;
  burgundyPlate: IconSurfacePlate;
  ivoryPlate: IconSurfacePlate;
}

export interface TechConceptEntry {
  slug: string;
  label: string;
  kind: "protocol" | "concept" | "standard" | "architecture";
  category: TechCategoryId;
  summary: string;
  hasBrandLogo: false;
}

export const TECH_ICON_CATEGORIES: readonly TechIconCategory[] = ${JSON.stringify(CATEGORIES, null, 2)} as const;

export const TECH_ICONS_MANIFEST: readonly TechIconEntry[] = ${JSON.stringify(results, null, 2)} as const;

export const TECH_CONCEPTS_MANIFEST: readonly TechConceptEntry[] = ${JSON.stringify(TECH_CONCEPTS, null, 2)} as const;
`;

  await fs.writeFile(TS_MANIFEST_PATH, tsFile, "utf8");

  console.log(`\nDONE! Generated ${verifiedCount}/${results.length} verified colored SVG assets across ${CATEGORIES.length} categories.`);
  console.log(`Concepts (text-label manifest): ${TECH_CONCEPTS.length}`);
  if (missing.length > 0) {
    console.log("MISSING / UNVERIFIED:", JSON.stringify(missing, null, 2));
  } else {
    console.log("ZERO missing or unverified logos!");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

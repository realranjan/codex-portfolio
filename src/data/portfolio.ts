import type { StaticImageData } from "next/image";
import neuralMeshImage from "@/assets/images/project_neural_mesh_1794929884871.jpg";
import marbleCompilerImage from "@/assets/images/project_marble_compiler_1794929886033.jpg";
import flightTelemetryImage from "@/assets/images/project_flight_telemetry_1794929886960.jpg";
import chronosKvImage from "@/assets/images/project_chronos_kv_1794930957187.jpg";
import delosShaderImage from "@/assets/images/project_delos_shader_1794930957843.jpg";
import portraitImage from "@/assets/images/portrait_engineer_marble_1794929888150.jpg";
import type { FlightWaypoint } from "@/lib/motion";

export interface ProjectCaseStudy {
  id: string;
  index: string;
  title: string;
  serifAccent: string;
  category: string;
  year: string;
  role: string;
  summary: string;
  image: StaticImageData;
  imageAlt: string;
  revealDirection: "left" | "right" | "up";
  metrics: readonly { label: string; value: string }[];
  stack: readonly string[];
  architecture: readonly string[];
  outcome: string;
  coordinates: string;
  repoSlug: string;
}

export interface CareerStop {
  id: string;
  code: string;
  city: string;
  coordinates: string;
  period: string;
  company: string;
  role: string;
  summary: string;
  highlights: readonly string[];
  waypoint: FlightWaypoint;
}

export const IDENTITY = {
  monogram: "RV",
  name: "Ranjan Vernekar",
  roleLine: "Full stack systems · AI engineering · Spatial data",
  email: "ranjanvernekar45@gmail.com",
  location: "Bengaluru · San Francisco",
  github: "https://github.com/realranjan",
  linkedin: "https://linkedin.com",
  portrait: portraitImage,
  portraitAlt:
    "Editorial studio portrait of Ranjan Vernekar beside a classical marble bust in obsidian chiaroscuro lighting",
} as const;

export const NAV_LINKS = [
  { label: "Projects", href: "#projects", id: "projects" },
  { label: "About", href: "#about", id: "about" },
  { label: "Experience", href: "#experience", id: "experience" },
  { label: "Contact", href: "#contact", id: "contact" },
] as const;

export const PROJECTS: readonly ProjectCaseStudy[] = [
  {
    id: "aether-mesh",
    index: "01",
    title: "Aether Mesh",
    serifAccent: "orchestration",
    category: "Distributed AI Infrastructure",
    year: "2026",
    role: "Lead Systems Architect",
    summary:
      "Multi-region inference router and GPU memory scheduler coordinating speculative decoding across heterogeneous clusters with sub-40ms tail routing overhead.",
    image: neuralMeshImage,
    imageAlt:
      "Architectural dark rendering of the Aether Mesh distributed GPU compute topology with fine lavender vector lines",
    revealDirection: "up",
    metrics: [
      { label: "P99 Route Latency", value: "34 ms" },
      { label: "Cluster Utilization", value: "91.4%" },
      { label: "Throughput Gain", value: "2.8x" },
    ],
    stack: ["Rust", "TypeScript", "Kubernetes", "CUDA", "gRPC", "Prometheus"],
    architecture: [
      "Deterministic KV-cache locality router avoiding cross-rack tensor stalls during bursty token streams.",
      "Zero-copy telemetry ring buffer exporting per-SM saturation without locking inference threads.",
      "Spatial topology console allowing operators to inspect shard congestion in real time.",
    ],
    outcome:
      "Reduced GPU idle waste by 41% across production reasoning workloads while maintaining strict SLA bounds.",
    coordinates: "37.7749° N · 122.4194° W",
    repoSlug: "github.com/realranjan/aether-mesh",
  },
  {
    id: "phidias-surface",
    index: "02",
    title: "Phidias Compiler",
    serifAccent: "geometry",
    category: "Neural Graphics & WebGL",
    year: "2025",
    role: "Graphics & ML Engineer",
    summary:
      "Browser-native surface sampler and signed-distance compiler transforming high-poly classical scans into 66k deterministic GLSL glyph particles.",
    image: marbleCompilerImage,
    imageAlt:
      "Classical Greco-Roman marble sculpture fragment mapped with pale violet contour scanlines against deep shadow",
    revealDirection: "left",
    metrics: [
      { label: "Frame Budget", value: "60 fps" },
      { label: "Compressed Mesh", value: "1.4 MB" },
      { label: "Draw Calls", value: "3" },
    ],
    stack: ["Three.js", "GLSL", "WebGL2", "Python", "PyTorch", "Next.js"],
    architecture: [
      "Adaptive Poisson-disk bin sampling preserving facial curvature and sculptural relief with fixed memory.",
      "Custom vertex/fragment shader pipeline encoding glyph luminance indices inside a single 256px atlas.",
      "Software-WebGL detection and on-demand frame pacing for deterministic fallback on constrained hardware.",
    ],
    outcome:
      "Achieved instant interactive sculpture inspection under 1.5 MB payload across desktop and mobile devices.",
    coordinates: "37.9838° N · 23.7275° E",
    repoSlug: "github.com/realranjan/phidias-compiler",
  },
  {
    id: "meridian-telemetry",
    index: "03",
    title: "Meridian Flight",
    serifAccent: "trajectory",
    category: "Spatial Data & Anomaly Systems",
    year: "2025",
    role: "Principal Full-Stack Engineer",
    summary:
      "Real-time kinematic trajectory analyzer and predictive drift detector processing high-frequency spatial streams for autonomous routing corridors.",
    image: flightTelemetryImage,
    imageAlt:
      "Minimalist dark slate aerospace trajectory vector arcs with precision brass calipers in studio lighting",
    revealDirection: "right",
    metrics: [
      { label: "Events / Sec", value: "180k" },
      { label: "False Positives", value: "< 0.4%" },
      { label: "Replay Precision", value: "12 ms" },
    ],
    stack: ["Go", "ClickHouse", "WebSockets", "React", "GSAP", "D3"],
    architecture: [
      "Streaming Kalman residual scoring pipeline flagging micro-deviations ahead of boundary violations.",
      "Time-travel replay scrubbers synchronized across Canvas vector overlays and tabular flight logs.",
      "Strict schema contracts separating deterministic physics math from React presentation layers.",
    ],
    outcome:
      "Cut operator incident triage time from 14 minutes to 90 seconds across continuous fleet simulations.",
    coordinates: "47.3769° N · 8.5417° E",
    repoSlug: "github.com/realranjan/meridian-flight",
  },
  {
    id: "chronos-kv",
    index: "04",
    title: "Chronos KV",
    serifAccent: "consensus",
    category: "Distributed Storage Engine",
    year: "2024",
    role: "Systems Storage Engineer",
    summary:
      "Deterministic Raft-backed time-series log and hybrid NVMe compaction store engineered for multi-tenant model audit trails and replayable state.",
    image: chronosKvImage,
    imageAlt:
      "Obsidian and brushed titanium time-series storage core bound by fine pale lavender optical fiber lines",
    revealDirection: "up",
    metrics: [
      { label: "Write Throughput", value: "1.2 GB/s" },
      { label: "Tail Recovery", value: "210 ms" },
      { label: "Compaction Overhead", value: "< 6%" },
    ],
    stack: ["Rust", "io_uring", "Raft", "Arrow", "gRPC", "Linux"],
    architecture: [
      "Wait-free append ring leveraging io_uring direct I/O to eliminate kernel page-cache jitter.",
      "Columnar delta-encoding snapshots enabling point-in-time branch forks without full table copies.",
      "Automated chaos harness injecting asymmetric packet loss across five virtual availability zones.",
    ],
    outcome:
      "Sustained 99.995% write availability during cross-region failover drills with zero silent data drift.",
    coordinates: "40.7128° N · 74.0060° W",
    repoSlug: "github.com/realranjan/chronos-kv",
  },
  {
    id: "delos-prism",
    index: "05",
    title: "Delos Prism",
    serifAccent: "refraction",
    category: "Optical Rendering & Shaders",
    year: "2024",
    role: "Graphics & UI Architect",
    summary:
      "Interactive signed-distance refraction studio and shader node graph compiling real-time glass caustics and chiaroscuro lighting rigs for design teams.",
    image: delosShaderImage,
    imageAlt:
      "Classical Greco-Roman marble bust intersected by translucent frosted glass planes and pale violet contour lines",
    revealDirection: "left",
    metrics: [
      { label: "Shader Compile", value: "18 ms" },
      { label: "Spectral Samples", value: "16x" },
      { label: "Bundle Footprint", value: "94 KB" },
    ],
    stack: ["WebGL2", "GLSL", "TypeScript", "React 19", "GSAP", "Vite"],
    architecture: [
      "Single-pass signed-distance field raymarcher pairing dual-lobe specular marble BRDF with thin-film Fresnel planes.",
      "Static uniform dependency graph allowing artists to scrub dispersion and IOR without frame stalls.",
      "Accessibility-first preset keyboard navigator synced directly to live GPU buffer uniforms.",
    ],
    outcome:
      "Adopted across editorial product launches to ship interactive 3D hero studies under strict 100 KB budgets.",
    coordinates: "37.3944° N · 25.2664° E",
    repoSlug: "github.com/realranjan/delos-prism",
  },
];

export const DISCIPLINES = [
  {
    index: "01",
    title: "Systems & Full-Stack Architecture",
    detail:
      "Designing resilient APIs, low-latency streaming pipelines, and React/Next.js interfaces where structural clarity matches execution speed.",
  },
  {
    index: "02",
    title: "Applied AI & Inference Engineering",
    detail:
      "Bridging model research and production constraints—quantization, deterministic evaluation harnesses, and predictable latency budgets.",
  },
  {
    index: "03",
    title: "Spatial Graphics & Data Craft",
    detail:
      "Translating complex multi-dimensional telemetry and WebGL shaders into calm, legible editorial experiences.",
  },
] as const;

export const STACK_CATEGORIES = [
  {
    index: "01",
    name: "Interface & Motion",
    items: ["TypeScript", "Next.js", "React 19", "Tailwind CSS", "GSAP ScrollTrigger", "Three.js / GLSL"],
  },
  {
    index: "02",
    name: "Systems & Backend",
    items: ["Node.js", "Rust", "Go", "PostgreSQL", "ClickHouse", "gRPC & WebSockets"],
  },
  {
    index: "03",
    name: "AI & Modeling",
    items: ["PyTorch", "vLLM", "TensorRT-LLM", "CUDA Kernels", "Structured Evals", "Vector Indexing"],
  },
  {
    index: "04",
    name: "Infrastructure & Data",
    items: ["Kubernetes", "Docker", "Terraform", "OpenTelemetry", "Kafka", "Redis"],
  },
] as const;

export const CAREER_STOPS: readonly CareerStop[] = [
  {
    id: "blr",
    code: "BLR",
    city: "Bengaluru",
    coordinates: "12.9716° N · 77.5946° E",
    period: "2020 — 2022",
    company: "Kinetix Data Labs",
    role: "Software Engineer · Data Systems",
    summary:
      "Built high-throughput ETL ingestion workers and time-series diagnostics for industrial sensor arrays across manufacturing plants.",
    highlights: [
      "Authored streaming anomaly ingestion handling 45M daily telemetry frames.",
      "Reduced query p95 from 2.4s to 190ms through columnar partitioning.",
    ],
    waypoint: { id: "blr", stop: 0.08, x: 140, y: 120 },
  },
  {
    id: "zrh",
    code: "ZRH",
    city: "Zurich",
    coordinates: "47.3769° N · 8.5417° E",
    period: "2022 — 2023",
    company: "Helvetia Spatial Systems",
    role: "Full-Stack & Graphics Engineer",
    summary:
      "Engineered browser-based 3D terrain inspection and precision geospatial pipelines for alpine infrastructure monitoring.",
    highlights: [
      "Shipped custom WebGL point-cloud decimation shaders for 10M+ lidar nodes.",
      "Designed keyboard-accessible inspection workflows used by field engineers.",
    ],
    waypoint: { id: "zrh", stop: 0.38, x: 760, y: 360 },
  },
  {
    id: "nyc",
    code: "NYC",
    city: "New York",
    coordinates: "40.7128° N · 74.0060° W",
    period: "2023 — 2025",
    company: "Vellum Intelligence",
    role: "Senior AI Systems Engineer",
    summary:
      "Architected low-latency retrieval, structured reasoning pipelines, and real-time evaluation consoles for enterprise knowledge engines.",
    highlights: [
      "Scaled hybrid dense/lexical retrieval to 120M documents with sub-80ms recall.",
      "Built deterministic regression suites catching prompt and model drift pre-deploy.",
    ],
    waypoint: { id: "nyc", stop: 0.68, x: 240, y: 640 },
  },
  {
    id: "sfo",
    code: "SFO",
    city: "San Francisco",
    coordinates: "37.7749° N · 122.4194° W",
    period: "2025 — Present",
    company: "Independent & Principal Advisory",
    role: "Principal Full-Stack & AI Architect",
    summary:
      "Partnering with frontier engineering teams to design inference topologies, interactive 3D product systems, and high-craft web architecture.",
    highlights: [
      "Led architecture for multi-region GPU orchestration & spatial developer tools.",
      "Focused on systems where mathematical rigor meets unmistakable visual craft.",
    ],
    waypoint: { id: "sfo", stop: 0.94, x: 840, y: 890 },
  },
];

export const RESUME_SUMMARY = {
  headline: "Ranjan Vernekar — Principal Full-Stack, AI & Spatial Systems Engineer",
  education: "B.E. Computer Science & Engineering · Distributed Systems & Graphics Focus",
  highlights: [
    "6+ years building production distributed backends, ML inference infrastructure, and WebGL/React interfaces.",
    "Track record shipping sub-50ms inference routers, lidar/mesh compilers, and real-time telemetry platforms.",
    "Fluent across TypeScript, Rust, Python, Go, Three.js/GLSL, PyTorch, and Kubernetes.",
  ],
} as const;

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
  roleLine: "Systems Architecture · Applied AI · Real-Time Graphics",
  email: "ranjanvernekar45@gmail.com",
  location: "Bengaluru · San Francisco",
  github: "https://github.com/realranjan",
  linkedin: "https://linkedin.com",
  portrait: portraitImage,
  portraitAlt:
    "Studio photograph of Ranjan Vernekar beside a carved marble bust under directional studio lighting",
} as const;

export const NAV_LINKS = [
  { label: "Work", href: "#projects", id: "projects" },
  { label: "Practice", href: "#about", id: "about" },
  { label: "Experience", href: "#experience", id: "experience" },
  { label: "Contact", href: "#contact", id: "contact" },
] as const;

export const PROJECTS: readonly ProjectCaseStudy[] = [
  {
    id: "tensor-router",
    index: "01",
    title: "Tensor Router",
    serifAccent: "scheduling",
    category: "Distributed Inference",
    year: "2026",
    role: "Lead Systems Architect",
    summary:
      "Multi-region inference router and GPU memory scheduler coordinating speculative decoding across mixed H100/A100 pools under tight tail-latency budgets.",
    image: neuralMeshImage,
    imageAlt:
      "Architectural rendering of multi-region GPU routing topology with crisp hairline connections",
    revealDirection: "up",
    metrics: [
      { label: "P99 Route Latency", value: "34 ms" },
      { label: "Cluster Utilization", value: "91.4%" },
      { label: "Throughput Gain", value: "2.8x" },
    ],
    stack: ["Rust", "TypeScript", "Kubernetes", "CUDA", "gRPC", "Prometheus"],
    architecture: [
      "Deterministic KV-cache locality scheduler avoiding cross-rack tensor stalls during bursty token streams.",
      "Lock-free telemetry ring buffer exporting per-SM utilization without blocking inference workers.",
      "Live topology inspector for tracing shard congestion across availability zones.",
    ],
    outcome:
      "Cut idle GPU compute by 41% across production reasoning workloads while holding p99 latency under 35 ms.",
    coordinates: "San Francisco",
    repoSlug: "github.com/realranjan/tensor-router",
  },
  {
    id: "surface-compiler",
    index: "02",
    title: "Contour",
    serifAccent: "compiler",
    category: "WebGL & Surface Sampling",
    year: "2025",
    role: "Graphics Engineer",
    summary:
      "Browser-side surface sampler and vertex decimation tool compiling dense 3D scans into 66k instanced ASCII particles with deterministic frame budgets.",
    image: marbleCompilerImage,
    imageAlt:
      "Carved marble sculpture fragment overlaid with fine wireframe contour lines against dark stone",
    revealDirection: "left",
    metrics: [
      { label: "Frame Budget", value: "60 fps" },
      { label: "Payload Size", value: "1.4 MB" },
      { label: "Draw Calls", value: "3" },
    ],
    stack: ["Three.js", "GLSL", "WebGL2", "Python", "PyTorch", "Next.js"],
    architecture: [
      "Poisson-disk spatial binning preserving facial relief and drapery folds in fixed GPU memory.",
      "Custom fragment shader indexing a packed 256px glyph atlas in a single batched draw call.",
      "Software-WebGL detection with automatic fence-sync pacing on constrained headless hardware.",
    ],
    outcome:
      "Delivered sub-1.5 MB interactive sculpture loading across desktop and mobile viewports.",
    coordinates: "Athens / Web",
    repoSlug: "github.com/realranjan/contour",
  },
  {
    id: "flightline",
    index: "03",
    title: "Flightline",
    serifAccent: "telemetry",
    category: "Streaming Anomaly Systems",
    year: "2025",
    role: "Principal Full-Stack Engineer",
    summary:
      "High-frequency kinematic stream processor and drift detector tracking autonomous routing corridors across 180k events per second.",
    image: flightTelemetryImage,
    imageAlt:
      "Minimalist dark slate aerospace trajectory vector arcs paired with brass measurement instruments",
    revealDirection: "right",
    metrics: [
      { label: "Events / Sec", value: "180k" },
      { label: "False Positives", value: "< 0.4%" },
      { label: "Replay Precision", value: "12 ms" },
    ],
    stack: ["Go", "ClickHouse", "WebSockets", "React", "GSAP", "D3"],
    architecture: [
      "Streaming Kalman residual scoring pipeline flagging corridor drift prior to threshold breach.",
      "Time-travel replay scrubber synchronized between Canvas trajectory arcs and ClickHouse event tables.",
      "Isolated pure kinematic math module verified by automated deterministic property tests.",
    ],
    outcome:
      "Reduced operator incident triage from 14 minutes to 90 seconds across fleet replay simulations.",
    coordinates: "Zurich",
    repoSlug: "github.com/realranjan/flightline",
  },
  {
    id: "walden-log",
    index: "04",
    title: "Walden Log",
    serifAccent: "storage",
    category: "Distributed Storage Engine",
    year: "2024",
    role: "Systems Storage Engineer",
    summary:
      "Raft-replicated time-series write-ahead log and NVMe compaction engine built for multi-tenant model audit trails and deterministic state replay.",
    image: chronosKvImage,
    imageAlt:
      "Brushed titanium and basalt storage core hardware linked by fine optical fiber lines",
    revealDirection: "up",
    metrics: [
      { label: "Write Throughput", value: "1.2 GB/s" },
      { label: "Tail Recovery", value: "210 ms" },
      { label: "Compaction Overhead", value: "< 6%" },
    ],
    stack: ["Rust", "io_uring", "Raft", "Arrow", "gRPC", "Linux"],
    architecture: [
      "Wait-free append ring built on io_uring direct I/O to eliminate kernel page-cache jitter.",
      "Columnar delta snapshots supporting instant point-in-time branch forks without full table duplication.",
      "Fault-injection harness simulating asymmetric packet drops across five virtual clusters.",
    ],
    outcome:
      "Held 99.995% write availability during multi-zone failover drills with zero silent drift.",
    coordinates: "New York",
    repoSlug: "github.com/realranjan/walden-log",
  },
  {
    id: "prism-sdf",
    index: "05",
    title: "Prism Studio",
    serifAccent: "lighting",
    category: "Optical Rendering & Shaders",
    year: "2024",
    role: "Graphics & UI Architect",
    summary:
      "Signed-distance refraction sandbox and uniform editor compiling real-time Fresnel planes and studio lighting rigs directly in the browser.",
    image: delosShaderImage,
    imageAlt:
      "Carved marble sculpture intersected by frosted optical glass planes and fine light refraction lines",
    revealDirection: "left",
    metrics: [
      { label: "Shader Compile", value: "18 ms" },
      { label: "Spectral Samples", value: "16x" },
      { label: "Bundle Size", value: "94 KB" },
    ],
    stack: ["WebGL2", "GLSL", "TypeScript", "React 19", "GSAP", "Vite"],
    architecture: [
      "Single-pass SDF raymarcher pairing specular marble shading with thin-film Fresnel refraction planes.",
      "Static uniform graph letting artists scrub dispersion and camera focal length without stalling frames.",
      "Keyboard-accessible scene preset controls mapped directly to live GPU uniforms.",
    ],
    outcome:
      "Shipped across interactive web launches with full real-time shaders under a 100 KB client budget.",
    coordinates: "Bengaluru",
    repoSlug: "github.com/realranjan/prism-studio",
  },
];

export const DISCIPLINES = [
  {
    index: "01",
    title: "Distributed Systems & Full-Stack",
    detail:
      "High-throughput APIs, streaming pipelines, and React/Next.js applications built with tight latency budgets and clean boundaries.",
  },
  {
    index: "02",
    title: "Applied AI Infrastructure",
    detail:
      "Production inference routing, quantization tradeoffs, structured evaluation harnesses, and predictable GPU utilization.",
  },
  {
    index: "03",
    title: "Real-Time WebGL & Graphics",
    detail:
      "Custom GLSL shaders, point-cloud decimation, and tactile scroll-linked interfaces that hold steady frame times.",
  },
] as const;

export const STACK_CATEGORIES = [
  {
    index: "01",
    name: "Interface & Graphics",
    items: ["TypeScript", "Next.js", "React 19", "Tailwind CSS", "GSAP", "Three.js / GLSL"],
  },
  {
    index: "02",
    name: "Systems & Storage",
    items: ["Node.js", "Rust", "Go", "PostgreSQL", "ClickHouse", "gRPC & WebSockets"],
  },
  {
    index: "03",
    name: "Inference & ML",
    items: ["PyTorch", "vLLM", "TensorRT-LLM", "CUDA Kernels", "Structured Evals", "Vector Search"],
  },
  {
    index: "04",
    name: "Infrastructure",
    items: ["Kubernetes", "Docker", "Terraform", "OpenTelemetry", "Kafka", "Redis"],
  },
] as const;

export const CAREER_STOPS: readonly CareerStop[] = [
  {
    id: "blr",
    code: "01",
    city: "Bengaluru",
    coordinates: "2020 — 2022",
    period: "2020 — 2022",
    company: "Northtrack Systems",
    role: "Software Engineer · Data Infrastructure",
    summary:
      "Built high-throughput ETL workers and time-series diagnostics for industrial sensor networks across manufacturing sites.",
    highlights: [
      "Authored streaming anomaly ingestion processing 45M daily sensor frames.",
      "Cut p95 analytical query latency from 2.4 s to 190 ms with columnar partitioning.",
    ],
    waypoint: { id: "blr", stop: 0.08, x: 140, y: 120 },
  },
  {
    id: "zrh",
    code: "02",
    city: "Zurich",
    coordinates: "2022 — 2023",
    period: "2022 — 2023",
    company: "Alpen Spatial Lab",
    role: "Graphics & Full-Stack Engineer",
    summary:
      "Engineered browser-based 3D terrain viewers and geospatial inspection pipelines for alpine civil infrastructure.",
    highlights: [
      "Built custom WebGL point-cloud decimation shaders rendering 10M+ lidar survey nodes.",
      "Designed keyboard-accessible CAD inspection tools used daily by field engineers.",
    ],
    waypoint: { id: "zrh", stop: 0.38, x: 760, y: 360 },
  },
  {
    id: "nyc",
    code: "03",
    city: "New York",
    coordinates: "2023 — 2025",
    period: "2023 — 2025",
    company: "LatticeSearch AI",
    role: "Senior AI Systems Engineer",
    summary:
      "Architected low-latency hybrid retrieval pipelines, structured generation routers, and regression harnesses for enterprise search.",
    highlights: [
      "Scaled dense/lexical retrieval across 120M documents with sub-80 ms p99 recall.",
      "Built automated regression harnesses catching prompt and model drift prior to release.",
    ],
    waypoint: { id: "nyc", stop: 0.68, x: 240, y: 640 },
  },
  {
    id: "sfo",
    code: "04",
    city: "San Francisco",
    coordinates: "2025 — Present",
    period: "2025 — Present",
    company: "Independent Principal Advisory",
    role: "Principal Systems & AI Architect",
    summary:
      "Partnering with product teams on multi-region GPU routing, interactive 3D engineering tools, and high-craft web architecture.",
    highlights: [
      "Led architecture for multi-region inference clusters and low-latency developer tooling.",
      "Delivered full-stack systems pairing mathematical rigor with restrained visual design.",
    ],
    waypoint: { id: "sfo", stop: 0.94, x: 840, y: 890 },
  },
];

export const RESUME_SUMMARY = {
  headline: "Ranjan Vernekar — Principal Full-Stack, AI & Graphics Engineer",
  education: "B.E. Computer Science & Engineering · Distributed Systems & Graphics Focus",
  highlights: [
    "6+ years shipping production distributed backends, ML inference routers, and WebGL/React systems.",
    "Track record building sub-50 ms model routers, 3D surface compilers, and real-time telemetry tools.",
    "Fluent across TypeScript, Rust, Python, Go, Three.js/GLSL, PyTorch, and Kubernetes.",
  ],
} as const;

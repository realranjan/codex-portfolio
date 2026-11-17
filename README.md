# Portfolio starter

A Next.js and React portfolio for a full stack developer, AI engineer, and data scientist. It uses Tailwind CSS, GSAP, Lenis, Motion for React (the Framer Motion library), Lucide, and three Google font families: Space Grotesk, DM Sans, and JetBrains Mono. The supplied ASCII GIF powers the pinned hero through a seekable video. The site uses a continuous dark canvas with a warm accent drawn from the GIF, subtle section reveals, and reduced-motion support. The page includes Work, Expertise, Stack, Motion lab, Journey map, About, and Contact. Projects, stack tools, animation work, journey milestones, portrait, name, biography, and contact links remain placeholders for the owner's content.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Main files

- `src/app/page.tsx` — page structure, intro animation, and smooth scrolling
- `src/app/globals.css` — colors and shared styles
- `src/app/layout.tsx` — font and page metadata
- `src/components/ascii-background.tsx` — scroll-controlled hero video
- `public/ascii-art-scroll.mp4` — optimized, seekable version of the supplied GIF
- `public/ascii-art-poster.webp` — first frame fallback
- `public/` — place supplied assets here as the design develops

The poster requests high fetch priority. The hero stays pinned while scrolling scrubs the GIF's frames in both directions; Work enters after the final frame. The seekable video and poster retain the source GIF's full 1920 × 1072 resolution to preserve the small ASCII characters. Reduced-motion visitors see the first frame and can scroll directly to Work. Open Graph uses the supplied GIF's poster frame.

The visual and copy cleanup followed [Unslop by Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0.

## Vercel

The app uses Next.js with Turbopack and includes a `vercel.json` framework preset. It can be imported into Vercel from this project directory. Set `NEXT_PUBLIC_SITE_URL` to the final public URL when one is chosen so share metadata uses the right domain. No deployment has been created yet.

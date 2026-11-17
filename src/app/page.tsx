"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import Lenis from "lenis";
import { motion, MotionConfig } from "motion/react";
import { ArrowDown, ArrowUp, MoveUpRight } from "lucide-react";

const ParticlePortrait = dynamic(() => import("@/components/particle-portrait"), { ssr: false });
const LightRays = dynamic(() => import("@/components/light-rays"), { ssr: false });
const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.08 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
} as const;
const projects = ["01", "02", "03"] as const;
const disciplines = [
  { title: "Full stack development", detail: "From the interface people use to the systems working behind it." },
  { title: "AI engineering", detail: "Turning models and ideas into useful, dependable products." },
  { title: "Data science", detail: "Finding the signal, testing the idea, and making the result understandable." },
] as const;
const stackGroups = ["Frontend", "Backend", "AI & machine learning", "Data & infrastructure"] as const;
const journeySlots = ["Where it started", "A turning point", "What comes next"] as const;

export default function Home() {
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, anchors: true });
    const animation = gsap.context(() => {
      gsap.from("[data-intro]", { y: 10, opacity: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" });
    }, pageRef);
    return () => { animation.revert(); lenis.destroy(); };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <main ref={pageRef}>
      <div className="hero-runway" id="top">
        <section className="hero-section" aria-labelledby="hero-heading">
          <LightRays
            className="hero-rays"
            style={{}}
            raysOrigin="top-right"
            raysColor="#9ac7b6"
            raysSpeed={0.45}
            lightSpread={0.7}
            rayLength={2.8}
            rayDensity={1.4}
            raySharpness={0.78}
            tilt={28}
            glow={0.38}
            haze={0.2}
            atmosphere={0}
            intensity={1.7}
            opacity={0.85}
            followMouse
            mouseInfluence={0.07}
            cursorShadow={false}
            clickPulse={false}
            maxDevicePixelRatio={1.25}
          />
          <ParticlePortrait />
          <header className="site-header" data-intro>
            <a className="wordmark" href="#top">Your name<span className="wordmark-mark">®</span></a>
            <nav aria-label="Main navigation">
              <a href="#work">Work</a><a href="#expertise">Expertise</a><a href="#stack">Stack</a>
              <a href="#journey">Journey</a><a href="#contact">Contact</a>
            </nav>
          </header>
          <div className="hero-content">
            <p className="hero-kicker" data-intro>Full stack developer / AI engineer / Data scientist</p>
            <h1 id="hero-heading" data-intro>Ideas made <em>visible.</em></h1>
            <p className="hero-description" data-intro>I build digital products, intelligent systems, and experiences that invite a closer look.</p>
          </div>
          <div className="hero-footer" data-intro>
            <span className="scroll-cue">Hover to reveal · Scroll to explore <ArrowDown aria-hidden="true" size={16} strokeWidth={1.5} /></span>
            <span className="hero-count">01 / 08</span>
          </div>
        </section>
      </div>

      <section className="section-shell work-section" id="work" aria-labelledby="work-heading">
        <motion.div className="section-inner" {...reveal}>
          <div className="section-head"><span className="section-number">02 / 08</span><div><p className="section-kicker">Proof of work</p><h2 id="work-heading">Selected work<span className="accent-dot">.</span></h2></div></div>
          <div className="work-grid">
            {projects.map((number) => <article className="work-item" key={number} aria-label={`Project space ${number}`}>
              <div className="asset-slot" aria-hidden="true"><span>Project visual {number}</span></div>
              <div className="work-item-footer"><span>{number} / Project details</span><MoveUpRight aria-hidden="true" size={18} strokeWidth={1.5} /></div>
            </article>)}
          </div>
        </motion.div>
      </section>

      <section className="section-shell expertise-section" id="expertise" aria-labelledby="expertise-heading">
        <motion.div className="section-inner" {...reveal}>
          <div className="section-head"><span className="section-number">03 / 08</span><div><p className="section-kicker">Three connected disciplines</p><h2 id="expertise-heading">What I do<span className="accent-dot">.</span></h2></div></div>
          <div className="discipline-list">
            {disciplines.map((item, index) => <article className="discipline-row" key={item.title}>
              <span className="row-number">0{index + 1}</span><h3>{item.title}</h3><p>{item.detail}</p>
            </article>)}
          </div>
        </motion.div>
      </section>

      <section className="section-shell stack-section" id="stack" aria-labelledby="stack-heading">
        <motion.div className="section-inner" {...reveal}>
          <div className="section-head"><span className="section-number">04 / 08</span><div><p className="section-kicker">Tools and systems</p><h2 id="stack-heading">The stack<span className="accent-dot">.</span></h2></div></div>
          <p className="section-intro">A place for the technologies you actually use. Add your tools to each category when you send the details.</p>
          <div className="stack-grid">
            {stackGroups.map((group, index) => <div className="stack-card" key={group}>
              <span className="row-number">0{index + 1}</span><h3>{group}</h3>
              <div className="stack-placeholder" aria-label={`Space for ${group} tools`}>Your tools here</div>
            </div>)}
          </div>
        </motion.div>
      </section>

      <section className="section-shell motion-section" id="motion" aria-labelledby="motion-heading">
        <motion.div className="section-inner" {...reveal}>
          <div className="section-head"><span className="section-number">05 / 08</span><div><p className="section-kicker">Things in motion</p><h2 id="motion-heading">Motion lab<span className="accent-dot">.</span></h2></div></div>
          <div className="motion-layout">
            <p>Animations, interactions, and experiments deserve room to move. Your reel or interactive demo can live here.</p>
            <div className="motion-slot" aria-label="Space for an animation or interactive demo"><span>Animation / interactive demo</span></div>
          </div>
        </motion.div>
      </section>

      <section className="section-shell journey-section" id="journey" aria-labelledby="journey-heading">
        <motion.div className="section-inner" {...reveal}>
          <div className="section-head"><span className="section-number">06 / 08</span><div><p className="section-kicker">The path so far</p><h2 id="journey-heading">Journey map<span className="accent-dot">.</span></h2></div></div>
          <p className="section-intro">A timeline for the milestones, shifts, and projects that shaped your path. Dates and stories can be added later.</p>
          <ol className="journey-list">
            {journeySlots.map((slot, index) => <li key={slot}><span className="journey-marker">0{index + 1}</span><div><h3>{slot}</h3><p>Add a date and a short story</p></div></li>)}
          </ol>
        </motion.div>
      </section>

      <section className="section-shell about-section" id="about" aria-labelledby="about-heading">
        <motion.div className="section-inner" {...reveal}>
          <div className="section-head"><span className="section-number">07 / 08</span><div><p className="section-kicker">The person behind the work</p><h2 id="about-heading">About me<span className="accent-dot">.</span></h2></div></div>
          <div className="about-layout">
            <div className="about-copy"><p className="about-lead">Curious about the space between building things and understanding them.</p><p>Add your story here: what you care about, how you work, and what you want to build next.</p></div>
            <div className="portrait-slot" role="img" aria-label="Space reserved for a portrait"><span>Portrait / personal visual</span></div>
          </div>
        </motion.div>
      </section>

      <section className="section-shell contact-section" id="contact" aria-labelledby="contact-heading">
        <motion.div className="section-inner" {...reveal}>
          <div className="section-head"><span className="section-number">08 / 08</span><div><p className="section-kicker">Start a conversation</p><h2 id="contact-heading">Let’s build something<span className="accent-dot">.</span></h2></div></div>
          <p className="contact-copy">Have a project, question, or idea? Add your email and social links here when you’re ready.</p>
          <footer className="site-footer"><span>Your name®</span><a href="#top">Back to top <ArrowUp aria-hidden="true" size={16} strokeWidth={1.5} /></a></footer>
        </motion.div>
      </section>
    </main>
    </MotionConfig>
  );
}

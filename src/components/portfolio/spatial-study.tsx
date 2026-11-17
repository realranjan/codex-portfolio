"use client";

import { useState, type MutableRefObject } from "react";
import { RotateCcw } from "lucide-react";
import type { SpatialControlValues } from "@/components/particle-portrait";
import { AsciiScramble } from "@/components/motion/ascii-scramble";

interface SpatialStudyProps {
  controlsRef: MutableRefObject<SpatialControlValues>;
}

const PRESETS: readonly {
  id: string;
  label: string;
  values: SpatialControlValues;
  note: string;
}[] = [
  {
    id: "classical",
    label: "Classical Relief",
    values: { densityScale: 1.0, lightAzimuth: 0, dispersionBoost: 0 },
    note: "Balanced glyph sampling across Pentelic contours with neutral studio key light.",
  },
  {
    id: "dense",
    label: "High-Density Scan",
    values: { densityScale: 2.1, lightAzimuth: 0.9, dispersionBoost: -0.04 },
    note: "Increases surface glyph sampling density while rotating the key vector laterally.",
  },
  {
    id: "dispersed",
    label: "Exploded Lattice",
    values: { densityScale: 1.35, lightAzimuth: -1.1, dispersionBoost: 0.72 },
    note: "Pushes vertices along surface normals to expose underlying topology curvature.",
  },
];

export function SpatialStudy({ controlsRef }: SpatialStudyProps) {
  const [activePreset, setActivePreset] = useState("classical");
  const [density, setDensity] = useState(1.0);
  const [azimuth, setAzimuth] = useState(0);
  const [dispersion, setDispersion] = useState(0);

  const syncControls = (next: SpatialControlValues) => {
    controlsRef.current = next;
  };

  const applyPreset = (presetId: string) => {
    const found = PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActivePreset(found.id);
    setDensity(found.values.densityScale);
    setAzimuth(found.values.lightAzimuth);
    setDispersion(found.values.dispersionBoost);
    syncControls(found.values);
  };

  return (
    <div className="rounded-[16px] border border-[#393143] bg-[#17131F] p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#393143] pb-5">
        <div>
          <AsciiScramble
            text="GLSL UNIFORM CALIBRATION"
            className="type-tech-label text-[#BCA5D4]"
          />
          <h3 className="mt-1.5 text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-[#F3EEF8]">
            Sculpture shader <em className="type-serif-accent font-normal">parameters</em>
          </h3>
        </div>

        <button
          type="button"
          onClick={() => applyPreset("classical")}
          className="btn-secondary"
          aria-label="Reset shader calibration to classical defaults"
        >
          <RotateCcw size={14} strokeWidth={1.6} aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      {/* Presets */}
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Shader study presets">
        {PRESETS.map((preset) => {
          const isSelected = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              aria-pressed={isSelected}
              className={`px-3.5 py-2 rounded-[8px] text-xs font-mono uppercase tracking-[0.06em] transition-colors duration-200 cursor-pointer ${
                isSelected
                  ? "bg-[#BCA5D4] text-[#0D0B12] font-medium"
                  : "border border-[#393143] bg-[#0D0B12] text-[#ADA4B8] hover:border-[#BCA5D4] hover:text-[#F3EEF8]"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Interactive Sliders */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <label className="block">
          <div className="flex items-center justify-between text-xs font-mono text-[#ADA4B8] mb-2">
            <span className="uppercase tracking-[0.08em]">Sample Density</span>
            <span className="tabular-nums text-[#F3EEF8]">{density.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.4}
            step={0.05}
            value={density}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setActivePreset("custom");
              setDensity(val);
              syncControls({ densityScale: val, lightAzimuth: azimuth, dispersionBoost: dispersion });
            }}
            className="w-full accent-[#BCA5D4] cursor-pointer"
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between text-xs font-mono text-[#ADA4B8] mb-2">
            <span className="uppercase tracking-[0.08em]">Key Azimuth</span>
            <span className="tabular-nums text-[#F3EEF8]">{azimuth.toFixed(2)} rad</span>
          </div>
          <input
            type="range"
            min={-2.0}
            max={2.0}
            step={0.05}
            value={azimuth}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setActivePreset("custom");
              setAzimuth(val);
              syncControls({ densityScale: density, lightAzimuth: val, dispersionBoost: dispersion });
            }}
            className="w-full accent-[#BCA5D4] cursor-pointer"
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between text-xs font-mono text-[#ADA4B8] mb-2">
            <span className="uppercase tracking-[0.08em]">Normal Dispersion</span>
            <span className="tabular-nums text-[#F3EEF8]">{dispersion.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={-0.1}
            max={1.0}
            step={0.05}
            value={dispersion}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setActivePreset("custom");
              setDispersion(val);
              syncControls({ densityScale: density, lightAzimuth: azimuth, dispersionBoost: val });
            }}
            className="w-full accent-[#BCA5D4] cursor-pointer"
          />
        </label>
      </div>

      <p className="mt-5 border-t border-[#393143]/70 pt-4 text-sm text-[#ADA4B8]">
        {PRESETS.find((p) => p.id === activePreset)?.note ??
          "Custom uniform state active — scroll back up or inspect the live bust above to observe shader updates."}
      </p>
    </div>
  );
}

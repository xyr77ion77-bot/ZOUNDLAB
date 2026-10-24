"use client";

import { useApp } from "@/lib/store";
import { EQ_PRESETS, EQ20_FREQS, EQ_QUALITY_MODES } from "@/lib/audio-engine";
import { formatHz } from "@/lib/format";
import { Power, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function EqualizerView() {
  const {
    eqGains,
    eqBypass,
    eqPreset,
    bassBoost,
    preamp,
    limiterThreshold,
    dspMode,
    setEqBand,
    setEqPreset,
    setEqBypass,
    setBassBoost,
    setPreamp,
    setLimiterThreshold,
    setDspMode,
  } = useApp();
  const [qualityMode, setQualityMode] = useState<(typeof EQ_QUALITY_MODES)[number]>("balanced");

  const isPro = dspMode === "pro";

  return (
    <div className="min-h-full p-4 md:p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Equalizer</h1>
          <p className="text-sm text-muted-foreground">
            20 bandas ISO 266 · {isPro ? "Modo Pro (8 etapas DSP)" : "Modo Simple (EQ + Bass/Wide)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEqBypass(!eqBypass)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors",
              eqBypass
                ? "border-destructive/50 text-destructive bg-destructive/10"
                : "border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10"
            )}
          >
            <Power className="w-4 h-4" />
            {eqBypass ? "Bypassed" : "Activo"}
          </button>
          <button
            onClick={() => setEqPreset("Flat")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
        <div className="text-sm font-medium">Modo DSP</div>
        <div className="flex gap-1 border border-border rounded-md p-1">
          <button
            onClick={() => setDspMode("simple")}
            className={cn(
              "px-3 py-1 rounded text-xs font-medium",
              !isPro ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            Simple
          </button>
          <button
            onClick={() => setDspMode("pro")}
            className={cn(
              "px-3 py-1 rounded text-xs font-medium",
              isPro ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            Pro
          </button>
        </div>
        <div className="text-xs text-muted-foreground">
          {isPro
            ? "Expone las 8 etapas DSP con bypass individual y reorder limitado"
            : "Solo EQ + Bass/Wide visibles, las demás etapas en background"}
        </div>
      </div>

      {/* Presets */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Presets</div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(EQ_PRESETS).map((preset) => (
            <button
              key={preset}
              onClick={() => setEqPreset(preset)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
                eqPreset === preset
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* EQ 20 bandas verticales */}
      <div className="rounded-lg border border-border bg-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Frecuencias ISO 1/3 octava · 20 bandas
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Calidad:</span>
            <div className="flex gap-0.5 border border-border rounded-md p-0.5">
              {EQ_QUALITY_MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setQualityMode(m)}
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium capitalize",
                    qualityMode === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sliders verticales 20 bandas */}
        <div
          className={cn(
            "flex items-end justify-between gap-0.5 md:gap-1 transition-opacity",
            eqBypass && "opacity-40 pointer-events-none"
          )}
        >
          {EQ20_FREQS.map((freq, i) => {
            const gain = eqGains[i] ?? 0;
            const pct = ((gain + 12) / 24) * 100;
            return (
              <div key={freq} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <div className="text-[9px] md:text-[10px] font-mono text-muted-foreground tabular-nums">
                  {gain > 0 ? `+${gain.toFixed(0)}` : gain.toFixed(0)}
                </div>
                <div className="relative h-32 md:h-40 flex items-center justify-center">
                  {/* Track */}
                  <div className="absolute w-1 h-full bg-muted rounded-full" />
                  {/* Center line */}
                  <div className="absolute w-2 h-px bg-border" style={{ top: "50%" }} />
                  {/* Fill from center */}
                  <div
                    className={cn(
                      "absolute w-1 rounded-full",
                      gain >= 0
                        ? "bg-primary"
                        : "bg-chart-4"
                    )}
                    style={{
                      height: `${Math.abs(gain) / 12 * 50}%`,
                      top: gain >= 0 ? `${50 - (gain / 12) * 50}%` : "50%",
                    }}
                  />
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={gain}
                    onChange={(e) => setEqBand(i, parseFloat(e.target.value))}
                    className="eq-slider absolute opacity-0 cursor-pointer"
                    style={{
                      writingMode: "vertical-lr",
                      direction: "rtl",
                      width: "32px",
                      height: "100%",
                      WebkitAppearance: "slider-vertical",
                    }}
                  />
                  {/* Visual knob */}
                  <div
                    className="absolute w-3 h-3 rounded-full bg-primary border-2 border-background shadow-md pointer-events-none"
                    style={{ top: `calc(${100 - pct}% - 6px)` }}
                  />
                </div>
                <div className="text-[9px] md:text-[10px] font-mono text-muted-foreground">
                  {freq >= 1000 ? `${freq / 1000}k` : freq}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Otros parámetros DSP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Bass Boost</div>
              <div className="text-2xl font-bold tabular-nums">{bassBoost > 0 ? `+${bassBoost.toFixed(1)}` : bassBoost.toFixed(1)} <span className="text-sm text-muted-foreground font-normal">dB</span></div>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={15}
            step={0.5}
            value={bassBoost}
            onChange={(e) => setBassBoost(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="text-xs text-muted-foreground mt-2">Lowshelf @ 80Hz</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Preamp (ReplayGain)</div>
          <div className="text-2xl font-bold tabular-nums mb-3">
            {preamp > 0 ? `+${preamp.toFixed(1)}` : preamp.toFixed(1)} <span className="text-sm text-muted-foreground font-normal">dB</span>
          </div>
          <input
            type="range"
            min={-12}
            max={12}
            step={0.5}
            value={preamp}
            onChange={(e) => setPreamp(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="text-xs text-muted-foreground mt-2">Ganancia de entrada al pipeline</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Limiter Threshold</div>
          <div className="text-2xl font-bold tabular-nums mb-3">
            {limiterThreshold.toFixed(1)} <span className="text-sm text-muted-foreground font-normal">dBFS</span>
          </div>
          <input
            type="range"
            min={-12}
            max={0}
            step={0.5}
            value={limiterThreshold}
            onChange={(e) => setLimiterThreshold(parseFloat(e.target.value))}
            className="w-full accent-red-500"
          />
          <div className="text-xs text-muted-foreground mt-2">Brickwall no bypassable</div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useApp } from "@/lib/store";
import { useTheme, ThemeId } from "@/components/theme-provider";
import { Palette, Sliders, Shield, Cpu, Cloud, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { EQ20_FREQS } from "@/lib/audio-engine";

const THEMES: { id: ThemeId; label: string; description: string; preview: [string, string, string] }[] = [
  { id: "light", label: "Light", description: "Default Material You light", preview: ["#f6f4f8", "#7a4fdb", "#eaddff"] },
  { id: "dark", label: "Dark", description: "Default Material You dark", preview: ["#1b1b1f", "#cbb6ff", "#312859"] },
  { id: "sepia", label: "Sepia", description: "Lectura larga en tablet", preview: ["#f3ead8", "#9c7d52", "#e6d4b8"] },
  { id: "high-contrast", label: "High Contrast", description: "Accesibilidad visual", preview: ["#ffffff", "#e0422c", "#000000"] },
  { id: "amber", label: "Amber", description: "Tema marca (fusión jetAudio+AIMP)", preview: ["#f8f0d8", "#c89940", "#e6c878"] },
  { id: "slate", label: "Slate", description: "Minimalista profesional", preview: ["#fafbfc", "#6b7686", "#dde1e6"] },
];

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const { dspMode, setDspMode, eqBypass, eqGains, bassBoost, preamp, limiterThreshold } = useApp();
  const isPro = dspMode === "pro";

  return (
    <div className="min-h-full p-4 md:p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Configuración de la app · ZoundLab v0.1 (Fase 1)
        </p>
      </div>

      {/* Apariencia / Temas */}
      <section className="rounded-lg border border-border bg-card p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold">Apariencia</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Material You dynamic color se aplica en Android 12+ extrayendo paleta del wallpaper.
          En la web se usan 6 temas predefinidos como fallback.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex flex-col gap-2 p-3 rounded-lg border-2 transition-colors text-left",
                theme === t.id
                  ? "border-primary"
                  : "border-transparent hover:border-border bg-muted/50"
              )}
            >
              <div className="flex gap-1 h-10 rounded-md overflow-hidden">
                <div className="flex-1" style={{ background: t.preview[0] }} />
                <div className="flex-1" style={{ background: t.preview[1] }} />
                <div className="flex-1" style={{ background: t.preview[2] }} />
              </div>
              <div>
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{t.description}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Modo DSP */}
      <section className="rounded-lg border border-border bg-card p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold">Modo DSP</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDspMode("simple")}
            className={cn(
              "p-4 rounded-lg border text-left transition-colors",
              !isPro ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
            )}
          >
            <div className="font-semibold mb-1">Simple</div>
            <div className="text-xs text-muted-foreground">
              Expone solo EQ + Bass/Wide. Demás etapas DSP en background. Ideal para usuario general.
            </div>
          </button>
          <button
            onClick={() => setDspMode("pro")}
            className={cn(
              "p-4 rounded-lg border text-left transition-colors",
              isPro ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
            )}
          >
            <div className="font-semibold mb-1">Pro</div>
            <div className="text-xs text-muted-foreground">
              Expone las 8 etapas DSP con bypass individual y reorder limitado. Para audiófilos.
            </div>
          </button>
        </div>
      </section>

      {/* DSP chain actual */}
      <section className="rounded-lg border border-border bg-card p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold">DSP Chain actual</h2>
        </div>
        <div className="space-y-1.5">
          {[
            { name: "00 · Source", status: "Fijo", color: "bg-muted text-muted-foreground", note: "FFmpeg decoder → F32 interleaveado" },
            { name: "01 · ReplayGain", status: "Fijo", color: "bg-green-500/20 text-green-700 dark:text-green-400", note: `Preamp: ${preamp > 0 ? "+" : ""}${preamp.toFixed(1)} dB` },
            { name: "02 · EQ 20 bandas", status: eqBypass ? "Bypass" : "Activo", color: eqBypass ? "bg-red-500/20 text-red-700 dark:text-red-400" : "bg-primary/20 text-primary", note: `Banda 1: ${EQ20_FREQS[0]}Hz · Banda 20: ${EQ20_FREQS[19] / 1000}kHz` },
            { name: "03 · Bass/Wide", status: "Activo", color: "bg-chart-4/20 text-amber-700 dark:text-amber-400", note: `Bass: +${bassBoost.toFixed(1)} dB @ 80Hz` },
            { name: "04 · Crossfeed BS2B", status: isPro ? "Activo" : "Background", color: isPro ? "bg-chart-4/20 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground", note: "Para auriculares, reduce fatiga" },
            { name: "05 · 3D/Binaural", status: "V2", color: "bg-muted text-muted-foreground", note: "AM3D diferido a V2 (coste DSP alto)" },
            { name: "06 · Reverb", status: isPro ? "Activo" : "Background", color: isPro ? "bg-chart-4/20 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground", note: "IR convolucional + sintético" },
            { name: "07 · Limiter", status: "Fijo no bypass", color: "bg-red-500/20 text-red-700 dark:text-red-400", note: `Threshold: ${limiterThreshold.toFixed(1)} dBFS · Brickwall` },
            { name: "OUT · AAudio", status: "Output", color: "bg-muted text-muted-foreground", note: "24/32-bit · bit-perfect cuando device lo soporta" },
          ].map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-3 p-2.5 rounded-md border border-border bg-background/50"
            >
              <div className={cn("px-2 py-0.5 rounded text-xs font-medium", s.color)}>
                {s.status}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground truncate">{s.note}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacidad */}
      <section className="rounded-lg border border-border bg-card p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold">Privacidad</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 rounded bg-green-500/5">
            <span className="font-mono text-xs">usesCleartextTraffic</span>
            <span className="font-mono text-xs text-green-600 dark:text-green-400">false</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-green-500/5">
            <span className="font-mono text-xs">allowBackup</span>
            <span className="font-mono text-xs text-green-600 dark:text-green-400">false</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-green-500/5">
            <span className="font-mono text-xs">Firebase / AdMob</span>
            <span className="font-mono text-xs text-green-600 dark:text-green-400">No incluidos</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-green-500/5">
            <span className="font-mono text-xs">Crash reporting</span>
            <span className="font-mono text-xs text-green-600 dark:text-green-400">xcrash local (opt-in export)</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-green-500/5">
            <span className="font-mono text-xs">Telemetría</span>
            <span className="font-mono text-xs text-green-600 dark:text-green-400">No existe</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-green-500/5">
            <span className="font-mono text-xs">READ_PHONE_STATE</span>
            <span className="font-mono text-xs text-green-600 dark:text-green-400">No pedido</span>
          </div>
        </div>
      </section>

      {/* Cloud accounts */}
      <section className="rounded-lg border border-border bg-card p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold">Cuentas cloud</h2>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>No hay cuentas cloud conectadas. Disponible en V1 con OAuth2 + PKCE.</div>
          <div className="text-xs">
            Credenciales se almacenarán cifradas con EncryptedSharedPreferences + Android Keystore.
          </div>
        </div>
      </section>

      {/* About */}
      <section className="rounded-lg border border-border bg-card p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold">Sobre ZoundLab</h2>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">ZoundLab</strong> · v0.1 · Fase 1 · 24 Oct 2026
          </div>
          <div>App de música fusión orgánica de jetAudio + AIMP.</div>
          <div>Web Audio API implementa el contrato AudioEngine de la Spec de Arquitectura.</div>
          <div>En el APK Android nativo, el mismo contrato se implementaría sobre AAudio + FFmpeg + DSP C++ (Plan B) o AAudio + BASS plugin (Plan A).</div>
          <div className="pt-2 text-xs">Z.AI Design Lab · Spec de Arquitectura Fase 1</div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useApp } from "@/lib/store";
import { Play, Pause, SkipBack, SkipForward, Disc3 } from "lucide-react";
import { Spectrum } from "@/components/spectrum";
import { cn } from "@/lib/utils";

export function NowPlayingView() {
  const { currentTrack, isPlaying, togglePlayPause, next, prev, spectrum, dspMode } = useApp();

  return (
    <div className="min-h-full p-4 md:p-8 flex flex-col">
      {!currentTrack ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center">
            <Disc3 className="w-16 h-16 text-primary/40" />
          </div>
          <div>
            <div className="text-2xl font-bold mb-2">Sin track en reproducción</div>
            <div className="text-muted-foreground text-sm max-w-md">
              Selecciona un track de la Biblioteca o abre el Browser para cargar archivos locales o
              un stream de radio.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Album art + visualizer */}
          <div className="flex flex-col items-center gap-4">
            <div
              className={cn(
                "w-full max-w-md aspect-square rounded-2xl shadow-2xl overflow-hidden relative",
                "bg-gradient-to-br from-primary via-chart-4 to-chart-2"
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center text-primary-foreground">
                <Disc3 className={cn("w-32 h-32 transition-transform", isPlaying && "animate-spin")} style={{ animationDuration: "8s" }} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                <div className="text-xs uppercase tracking-widest opacity-70">Now Playing</div>
                <div className="font-bold text-lg leading-tight truncate">{currentTrack.title}</div>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {currentTrack.format} · {currentTrack.source === "url" ? "Streaming" : "Decode FFmpeg"}
            </div>
          </div>

          {/* Right: Track info + visualizer */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {currentTrack.album}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-1">{currentTrack.title}</h1>
              <div className="text-lg text-muted-foreground">{currentTrack.artist}</div>
              {currentTrack.genre && (
                <div className="text-sm text-muted-foreground/70 mt-2">
                  Género: {currentTrack.genre}
                </div>
              )}
            </div>

            {/* Visualizer */}
            <div className="h-32 rounded-xl bg-card border border-border p-3 overflow-hidden">
              <Spectrum data={spectrum} isPlaying={isPlaying} />
            </div>

            {/* DSP chain indicator (solo en Pro mode) */}
            {dspMode === "pro" && (
              <div className="rounded-xl bg-card border border-border p-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  DSP Chain Activa
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {["ReplayGain", "EQ 20", "Bass/Wide", "Crossfeed", "Reverb", "Limiter"].map((stage, i, arr) => (
                    <div key={stage} className="flex items-center gap-1.5 shrink-0">
                      <div
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap",
                          i === arr.length - 1
                            ? "bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/40"
                            : i === 1
                            ? "bg-primary/20 text-primary border border-primary/40"
                            : "bg-muted text-muted-foreground border border-border"
                        )}
                      >
                        {stage}
                      </div>
                      {i < arr.length - 1 && <span className="text-muted-foreground/40 text-xs">→</span>}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground/70 mt-2">
                  Modo Pro · Latencia total &lt; 30ms · 8 etapas activas
                </div>
              </div>
            )}

            {/* Big controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prev}
                className="p-3 rounded-full hover:bg-accent transition-colors"
                title="Anterior"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              <button
                onClick={togglePlayPause}
                className="p-5 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-lg"
                title={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
              </button>
              <button
                onClick={next}
                className="p-3 rounded-full hover:bg-accent transition-colors"
                title="Siguiente"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

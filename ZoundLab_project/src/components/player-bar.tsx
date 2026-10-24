"use client";

import { useApp } from "@/lib/store";
import { formatTime } from "@/lib/format";
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    repeat,
    shuffle,
    togglePlayPause,
    next,
    prev,
    seek,
    setRepeat,
    toggleShuffle,
  } = useApp();

  if (!currentTrack) {
    return (
      <div className="border-t border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
        Selecciona un track para empezar
      </div>
    );
  }

  const dur = duration || (currentTrack.duration ? currentTrack.duration * 1000 : 0);
  const pct = dur > 0 ? (position / dur) * 100 : 0;

  return (
    <div className="border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="px-4 py-3 flex items-center gap-4">
        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-initial md:w-64">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary via-chart-4 to-chart-2 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">{currentTrack.title}</div>
            <div className="text-xs text-muted-foreground truncate">
              {currentTrack.artist} · {currentTrack.format ?? "—"}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-1 max-w-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title="Aleatorio"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={prev} className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Anterior">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform"
              title={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button onClick={next} className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Siguiente">
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title={repeat === "off" ? "Repetir off" : repeat === "all" ? "Repetir todo" : "Repetir uno"}
            >
              {repeat === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          <div className="w-full flex items-center gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">{formatTime(position)}</span>
            <Slider
              value={[pct]}
              max={100}
              step={0.1}
              onValueChange={(v) => seek((v[0] / 100) * dur)}
              className="flex-1"
            />
            <span className="tabular-nums">{formatTime(dur)}</span>
          </div>
        </div>

        {/* Right side - format/bitrade indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground font-mono">
            {currentTrack.format ?? "—"}
          </span>
          <Volume2 className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

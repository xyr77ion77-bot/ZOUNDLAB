"use client";

import { useApp, View } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Disc3, ListMusic, Sliders, FolderOpen, ListVideo, Settings } from "lucide-react";

const NAV_ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "now-playing", label: "Now Playing", icon: Disc3 },
  { id: "library", label: "Biblioteca", icon: ListMusic },
  { id: "equalizer", label: "Equalizer", icon: Sliders },
  { id: "browser", label: "Browser", icon: FolderOpen },
  { id: "queue", label: "Cola", icon: ListVideo },
  { id: "settings", label: "Ajustes", icon: Settings },
];

export function Sidebar() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const dspMode = useApp((s) => s.dspMode);

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-chart-4 to-chart-2 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
            Z
          </div>
          <div>
            <div className="font-bold text-sidebar-foreground text-lg leading-tight">ZoundLab</div>
            <div className="text-xs text-sidebar-foreground/60 uppercase tracking-wider">
              {dspMode === "pro" ? "Pro Mode" : "Simple Mode"}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Pipeline DSP</div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            ReplayGain
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            EQ 20 bandas
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-chart-4" />
            Bass/Wide
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Limiter
          </div>
        </div>
      </div>
    </aside>
  );
}

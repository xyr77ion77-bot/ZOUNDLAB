"use client";

import { useApp, View } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Disc3, ListMusic, Sliders, FolderOpen, ListVideo, Settings } from "lucide-react";

const NAV_ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "now-playing", label: "Playing", icon: Disc3 },
  { id: "library", label: "Library", icon: ListMusic },
  { id: "equalizer", label: "EQ", icon: Sliders },
  { id: "browser", label: "Files", icon: FolderOpen },
  { id: "queue", label: "Queue", icon: ListVideo },
  { id: "settings", label: "Ajustes", icon: Settings },
];

export function MobileNav() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);

  return (
    <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="grid grid-cols-6 gap-1 p-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-md text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

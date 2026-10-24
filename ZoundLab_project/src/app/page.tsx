"use client";

import { useApp } from "@/lib/store";
import { NowPlayingView } from "@/components/views/now-playing";
import { LibraryView } from "@/components/views/library";
import { EqualizerView } from "@/components/views/equalizer";
import { BrowserView } from "@/components/views/browser";
import { QueueView } from "@/components/views/queue";
import { SettingsView } from "@/components/views/settings";
import { PlayerBar } from "@/components/player-bar";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { useState, useEffect } from "react";

export default function Home() {
  const view = useApp((s) => s.view);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && <Sidebar />}
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {view === "now-playing" && <NowPlayingView />}
            {view === "library" && <LibraryView />}
            {view === "equalizer" && <EqualizerView />}
            {view === "browser" && <BrowserView />}
            {view === "queue" && <QueueView />}
            {view === "settings" && <SettingsView />}
          </div>
          <PlayerBar />
          {isMobile && <MobileNav />}
        </main>
      </div>
    </div>
  );
}

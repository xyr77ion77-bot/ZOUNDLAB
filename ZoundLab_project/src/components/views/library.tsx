"use client";

import { useApp } from "@/lib/store";
import { formatTime } from "@/lib/format";
import { Play, Disc3, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

export function LibraryView() {
  const { library, playTrack, currentTrack, isPlaying } = useApp();
  const [tab, setTab] = useState<"tracks" | "albums" | "artists" | "genres">("tracks");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return library;
    const s = search.toLowerCase();
    return library.filter(
      (t) =>
        t.title.toLowerCase().includes(s) ||
        t.artist.toLowerCase().includes(s) ||
        (t.album?.toLowerCase().includes(s) ?? false) ||
        (t.genre?.toLowerCase().includes(s) ?? false)
    );
  }, [library, search]);

  const albums = useMemo(() => {
    const map = new Map<string, typeof library>();
    filtered.forEach((t) => {
      const k = t.album ?? "Sin álbum";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const artists = useMemo(() => {
    const map = new Map<string, typeof library>();
    filtered.forEach((t) => {
      const k = t.artist;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const genres = useMemo(() => {
    const map = new Map<string, typeof library>();
    filtered.forEach((t) => {
      const k = t.genre ?? "Sin género";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="min-h-full p-4 md:p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Biblioteca</h1>
        <p className="text-sm text-muted-foreground">
          {library.length} tracks · Indexed via MediaStore · Demo library con tonos sintéticos + 3 radios SomaFM
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-1 border border-border rounded-lg p-1 bg-card">
          {(["tracks", "albums", "artists", "genres"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "tracks" ? "Tracks" : t}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 sm:flex-initial sm:w-64 px-3 py-1.5 rounded-md border border-input bg-background text-sm"
        />
      </div>

      {/* Tracks list */}
      {tab === "tracks" && (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 w-10">#</th>
                <th className="text-left p-3">Título</th>
                <th className="text-left p-3 hidden md:table-cell">Artista</th>
                <th className="text-left p-3 hidden md:table-cell">Formato</th>
                <th className="text-right p-3 w-20">Duración</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const isActive = currentTrack?.id === t.id;
                return (
                  <tr
                    key={t.id}
                    onClick={() => playTrack(t, filtered)}
                    className={cn(
                      "border-t border-border cursor-pointer hover:bg-accent/50 transition-colors",
                      isActive && "bg-primary/10"
                    )}
                  >
                    <td className="p-3 text-muted-foreground tabular-nums">
                      {isActive && isPlaying ? (
                        <div className="flex gap-0.5 items-end h-3">
                          <span className="w-0.5 h-2 bg-primary animate-pulse" />
                          <span className="w-0.5 h-3 bg-primary animate-pulse" style={{ animationDelay: "0.15s" }} />
                          <span className="w-0.5 h-1.5 bg-primary animate-pulse" style={{ animationDelay: "0.3s" }} />
                        </div>
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className={cn("font-medium", isActive && "text-primary")}>{t.title}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{t.artist}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{t.artist}</td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {t.format ?? "—"}
                      </span>
                    </td>
                    <td className="p-3 text-right text-muted-foreground tabular-nums">
                      {t.duration > 0 ? formatTime(t.duration * 1000) : "∞"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Albums grid */}
      {tab === "albums" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albums.map(([album, tracks]) => (
            <button
              key={album}
              onClick={() => playTrack(tracks[0], tracks)}
              className="group flex flex-col gap-2 text-left"
            >
              <div className="aspect-square rounded-lg bg-gradient-to-br from-primary via-chart-4 to-chart-2 flex items-center justify-center text-primary-foreground group-hover:scale-[1.02] transition-transform shadow-md">
                <Music className="w-10 h-10 opacity-70" />
              </div>
              <div>
                <div className="font-medium text-sm truncate">{album}</div>
                <div className="text-xs text-muted-foreground">{tracks.length} tracks · {tracks[0].artist}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Artists list */}
      {tab === "artists" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {artists.map(([artist, tracks]) => (
            <button
              key={artist}
              onClick={() => playTrack(tracks[0], tracks)}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/40 to-chart-2/40 flex items-center justify-center text-primary font-bold">
                {artist.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{artist}</div>
                <div className="text-xs text-muted-foreground">{tracks.length} tracks</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Genres */}
      {tab === "genres" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {genres.map(([genre, tracks]) => (
            <button
              key={genre}
              onClick={() => playTrack(tracks[0], tracks)}
              className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left bg-gradient-to-br from-card to-muted/30"
            >
              <div className="font-bold text-lg mb-1">{genre}</div>
              <div className="text-xs text-muted-foreground">{tracks.length} tracks</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

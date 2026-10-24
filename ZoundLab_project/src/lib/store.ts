"use client";

import { create } from "zustand";
import { audioEngine, EQ_PRESETS } from "./audio-engine";

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt?: string;
  duration: number; // segundos
  url: string; // URL al audio
  source: "demo" | "file" | "url" | "webdav" | "cloud" | "smb" | "ftp";
  format?: string; // mp3, flac, etc.
  genre?: string;
  year?: number;
  trackNo?: number;
};

export type View = "now-playing" | "library" | "equalizer" | "browser" | "queue" | "settings";

interface AppState {
  // Navigation
  view: View;
  setView: (v: View) => void;

  // Player state
  isPlaying: boolean;
  currentTrack: Track | null;
  position: number; // ms
  duration: number; // ms
  queue: Track[];
  queueIndex: number;
  repeat: "off" | "all" | "one";
  shuffle: boolean;
  spectrum: Uint8Array | null;

  // Library
  library: Track[];

  // EQ state
  eqGains: number[]; // 20 valores
  eqBypass: boolean;
  eqPreset: string;
  bassBoost: number; // dB
  preamp: number; // dB
  limiterThreshold: number; // dB
  dspMode: "simple" | "pro";

  // Player actions
  playTrack: (track: Track, queueContext?: Track[]) => void;
  togglePlayPause: () => void;
  next: () => void;
  prev: () => void;
  seek: (ms: number) => void;
  setRepeat: (r: "off" | "all" | "one") => void;
  toggleShuffle: () => void;
  addToQueue: (tracks: Track[]) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setSpectrum: (data: Uint8Array) => void;

  // EQ actions
  setEqBand: (index: number, gain: number) => void;
  setEqAll: (gains: number[]) => void;
  setEqPreset: (preset: string) => void;
  setEqBypass: (bypass: boolean) => void;
  setBassBoost: (gain: number) => void;
  setPreamp: (gain: number) => void;
  setLimiterThreshold: (t: number) => void;
  setDspMode: (m: "simple" | "pro") => void;
}

// Tracks de demo generados sintéticamente (no dependen de ficheros externos)
// Usamos tonos puros y noise para demostrar el EQ y visualizer sin necesidad de archivos.
// En la app real, estos vendrían de MediaStore/SAF/WebDAV/cloud.
function makeDemoUrl(frequency: number, durationSec: number, type: "sine" | "chord" | "noise" | "binaural" = "sine") {
  // Generar WAV en runtime via AudioContext cuando el usuario hace play
  // Por simplicidad, devolvemos un marker y el AudioEngine lo maneja via makeDemoBuffer
  return `demo://${type}/${frequency}/${durationSec}`;
}

// Generar buffer de audio demo sinteticamente
// Necesita un AudioContext activo (no se cierra) para que el buffer sea valido
export function makeDemoBuffer(ctx: AudioContext, type: string, freq: number, durationSec: number): AudioBuffer | null {
  const sr = ctx.sampleRate;
  const frames = Math.floor(sr * durationSec);
  const buf = ctx.createBuffer(2, frames, sr);
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);
  for (let i = 0; i < frames; i++) {
    const t = i / sr;
    let l = 0, r = 0;
    if (type === "sine") {
      l = r = Math.sin(2 * Math.PI * freq * t) * 0.2;
      // Envelope ADSR simple
      const env = Math.min(1, t * 4) * Math.min(1, (durationSec - t) * 4);
      l *= env; r *= env;
    } else if (type === "chord") {
      // Mayor triada: 1, 3, 5
      l = r = (
        Math.sin(2 * Math.PI * freq * t) +
        Math.sin(2 * Math.PI * freq * 1.25 * t) +
        Math.sin(2 * Math.PI * freq * 1.5 * t)
      ) / 6;
    } else if (type === "noise") {
      l = (Math.random() * 2 - 1) * 0.1;
      r = (Math.random() * 2 - 1) * 0.1;
    } else if (type === "binaural") {
      // Binaural beat: L a 200Hz, R a 210Hz (beat de 10Hz alpha)
      l = Math.sin(2 * Math.PI * 200 * t) * 0.2;
      r = Math.sin(2 * Math.PI * (200 + freq / 10) * t) * 0.2;
    }
    L[i] = l; R[i] = r;
  }
  return buf;
}

// Library demo con 6 tracks que cubren distintos espectros para mostrar el EQ
const DEMO_LIBRARY: Track[] = [
  { id: "t1", title: "Sub Bass Test", artist: "ZoundLab Demo", album: "Frequencies Vol. 1", duration: 30, url: "demo://sine/55/30", source: "demo", format: "WAV", genre: "Test", trackNo: 1, year: 2026 },
  { id: "t2", title: "Bass Guitar Riff", artist: "ZoundLab Demo", album: "Frequencies Vol. 1", duration: 30, url: "demo://sine/110/30", source: "demo", format: "WAV", genre: "Test", trackNo: 2, year: 2026 },
  { id: "t3", title: "Mid Voice Test", artist: "ZoundLab Demo", album: "Frequencies Vol. 1", duration: 30, url: "demo://sine/440/30", source: "demo", format: "WAV", genre: "Test", trackNo: 3, year: 2026 },
  { id: "t4", title: "Treble Sweep", artist: "ZoundLab Demo", album: "Frequencies Vol. 1", duration: 30, url: "demo://sine/4000/30", source: "demo", format: "WAV", genre: "Test", trackNo: 4, year: 2026 },
  { id: "t5", title: "C Major Chord", artist: "ZoundLab Demo", album: "Frequencies Vol. 1", duration: 30, url: "demo://chord/261/30", source: "demo", format: "WAV", genre: "Demo", trackNo: 5, year: 2026 },
  { id: "t6", title: "Alpha Binaural Beat (10Hz)", artist: "ZoundLab Demo", album: "Frequencies Vol. 1", duration: 60, url: "demo://binaural/100/60", source: "demo", format: "WAV", genre: "Meditation", trackNo: 6, year: 2026 },
];

// Radio URLs públicas para demostrar URL streaming real (cuando hay red)
// SomaFM: streams públicos libres de uso
const RADIO_STREAMS: Track[] = [
  { id: "r1", title: "SomaFM Groove Salad", artist: "SomaFM", album: "Internet Radio", duration: 0, url: "https://ice1.somafm.com/groovesalad-128-mp3", source: "url", format: "MP3 stream", genre: "Ambient" },
  { id: "r2", title: "SomaFM Drone Zone", artist: "SomaFM", album: "Internet Radio", duration: 0, url: "https://ice1.somafm.com/dronezone-128-mp3", source: "url", format: "MP3 stream", genre: "Ambient" },
  { id: "r3", title: "SomaFM Lush", artist: "SomaFM", album: "Internet Radio", duration: 0, url: "https://ice1.somafm.com/lush-128-mp3", source: "url", format: "MP3 stream", genre: "Vocals" },
];

export { RADIO_STREAMS, DEMO_LIBRARY };

export const useApp = create<AppState>((set, get) => ({
  view: "now-playing",
  setView: (v) => set({ view: v }),

  isPlaying: false,
  currentTrack: null,
  position: 0,
  duration: 0,
  queue: [],
  queueIndex: -1,
  repeat: "off",
  shuffle: false,
  spectrum: null,

  library: [...DEMO_LIBRARY, ...RADIO_STREAMS],

  eqGains: new Array(20).fill(0),
  eqBypass: false,
  eqPreset: "Flat",
  bassBoost: 0,
  preamp: 0,
  limiterThreshold: -3,
  dspMode: "simple",

  playTrack: (track, queueContext) => {
    const queue = queueContext ?? [track];
    const queueIndex = queueContext ? queue.findIndex((t) => t.id === track.id) : 0;
    set({ queue, queueIndex, currentTrack: track, isPlaying: false, position: 0 });

    // Hookear callbacks
    audioEngine.onStateChange = (s) => {
      set({ isPlaying: s === "PLAYING" });
    };
    audioEngine.onPositionChange = (p) => set({ position: p });
    audioEngine.onDurationChange = (d) => set({ duration: d * 1000 });
    audioEngine.onEnded = () => {
      const st = get();
      if (st.repeat === "one") {
        get().playTrack(track, queueContext);
      } else {
        get().next();
      }
    };
    audioEngine.onSpectrum = (data) => {
      // throttle: solo actualizar si está en now-playing
      get().setSpectrum(data);
    };

    // Aplicar EQ actual al cargar
    const { eqGains, eqBypass, bassBoost, preamp, limiterThreshold } = get();
    if (!eqBypass) audioEngine.setEqAll(eqGains);
    audioEngine.setBassBoost(bassBoost);
    audioEngine.setPreamp(preamp);
    audioEngine.setLimiterThreshold(limiterThreshold);

    // Demo URL handler
    if (track.url.startsWith("demo://")) {
      const [_, type, freqStr, durStr] = track.url.split("/");
      const freq = parseFloat(freqStr);
      const dur = parseFloat(durStr);
      // AudioEngine no soporta demo URLs nativamente, hack: creamos un buffer y lo cargamos
      // Para simplificar, llamar a una funcion interna
      loadDemoIntoEngine(type, freq, dur).then(() => {
        audioEngine.play();
      });
      return;
    }

    audioEngine.load(track.url).then(() => {
      audioEngine.play();
    });
  },

  togglePlayPause: () => {
    const st = get();
    if (st.isPlaying) {
      audioEngine.pause();
    } else if (st.currentTrack) {
      audioEngine.play();
    }
  },

  next: () => {
    const st = get();
    if (st.queue.length === 0) return;
    let nextIdx;
    if (st.shuffle) {
      nextIdx = Math.floor(Math.random() * st.queue.length);
    } else {
      nextIdx = st.queueIndex + 1;
      if (nextIdx >= st.queue.length) {
        if (st.repeat === "all") nextIdx = 0;
        else return;
      }
    }
    set({ queueIndex: nextIdx });
    get().playTrack(st.queue[nextIdx], st.queue);
  },

  prev: () => {
    const st = get();
    if (st.queue.length === 0) return;
    const prevIdx = st.queueIndex - 1 < 0 ? st.queue.length - 1 : st.queueIndex - 1;
    set({ queueIndex: prevIdx });
    get().playTrack(st.queue[prevIdx], st.queue);
  },

  seek: (ms) => {
    audioEngine.seek(ms);
    set({ position: ms });
  },

  setRepeat: (r) => set({ repeat: r }),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

  addToQueue: (tracks) => set((s) => ({ queue: [...s.queue, ...tracks] })),

  removeFromQueue: (index) => set((s) => {
    const q = [...s.queue];
    q.splice(index, 1);
    return { queue: q };
  }),

  reorderQueue: (from, to) => set((s) => {
    const q = [...s.queue];
    const [moved] = q.splice(from, 1);
    q.splice(to, 0, moved);
    return { queue: q };
  }),

  clearQueue: () => set({ queue: [], queueIndex: -1, currentTrack: null, isPlaying: false, position: 0, duration: 0 }),
  setSpectrum: (data) => set({ spectrum: data }),

  setEqBand: (index, gain) => set((s) => {
    const gains = [...s.eqGains];
    gains[index] = gain;
    audioEngine.setEqBand(index, gain);
    return { eqGains: gains, eqPreset: "Custom" };
  }),
  setEqAll: (gains) => {
    audioEngine.setEqAll(gains);
    set({ eqGains: gains });
  },
  setEqPreset: (preset) => {
    const gains = EQ_PRESETS[preset] ?? new Array(20).fill(0);
    audioEngine.setEqAll(gains);
    set({ eqGains: gains, eqPreset: preset });
  },
  setEqBypass: (bypass) => {
    if (bypass) {
      audioEngine.setEqAll(new Array(20).fill(0));
    } else {
      audioEngine.setEqAll(get().eqGains);
    }
    set({ eqBypass: bypass });
  },
  setBassBoost: (gain) => {
    audioEngine.setBassBoost(gain);
    set({ bassBoost: gain });
  },
  setPreamp: (gain) => {
    audioEngine.setPreamp(gain);
    set({ preamp: gain });
  },
  setLimiterThreshold: (t) => {
    audioEngine.setLimiterThreshold(t);
    set({ limiterThreshold: t });
  },
  setDspMode: (m) => set({ dspMode: m }),
}));

// Helper para cargar un demo buffer en el engine
async function loadDemoIntoEngine(type: string, freq: number, dur: number): Promise<void> {
  // Asegurar que el AudioContext del engine existe
  const ctx = (audioEngine as any).ensureContext() as AudioContext;
  if (!ctx) return;
  // Crear el buffer en el MISMO ctx del engine
  const buf = makeDemoBuffer(ctx, type, freq, dur);
  if (!buf) return;
  // Asignar directamente al estado del engine
  (audioEngine as any).currentBuffer = buf;
  (audioEngine as any).currentUrl = null;
  (audioEngine as any).duration = buf.duration;
  audioEngine.onDurationChange?.(buf.duration);
  (audioEngine as any).pausedAt = 0;
  (audioEngine as any).position = 0;
  audioEngine.onPositionChange?.(0);
  (audioEngine as any).state = "IDLE";
}

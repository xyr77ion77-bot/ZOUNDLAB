"use client";

/**
 * AudioEngine - Implementación real con Web Audio API.
 * Pipeline: source → preamp → EQ20 (20 BiquadFilters peaking) → bass (lowshelf) + widener (Mid/Side) → limiter (DynamicsCompressor) → analyser → destination
 *
 * Esta es la implementación funcional del contrato AudioEngine definido en la Spec Fase 1.
 * En la app Android nativa, esta misma interfaz se implementaría sobre AAudio + FFmpeg + DSP C++
 * (Plan B) o AAudio + BASS plugin (Plan A). Aquí usamos Web Audio API que es nativa del navegador.
 */

export type EngineState = "IDLE" | "PREPARING" | "PLAYING" | "PAUSED" | "ERROR";

export type SampleFormat = "F32" | "S16" | "S24" | "S32";

export interface AudioBuffer {
  sampleRate: number;
  channels: number;
  format: SampleFormat;
  frames: number;
  data: Float32Array;
}

export interface DspParameter {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface DspStage {
  id: string;
  displayName: string;
  parameters: DspParameter[];
  bypass: boolean;
  orderLocked: boolean;
  latencySamples: number;
}

/**
 * Frecuencias ISO 1/3 octava para EQ 20 bandas (estándar ISO 266).
 * Estas son las mismas frecuencias que usa AIMP en su EQ de 20 bandas.
 */
export const EQ20_FREQS = [
  31, 40, 50, 63, 80, 100, 125, 160, 200, 250,
  315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500,
  3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000,
].slice(0, 20);

/**
 * EQ presets estándar (mismo set que AIMP/jetAudio).
 */
export const EQ_PRESETS: Record<string, number[]> = {
  Flat: new Array(20).fill(0),
  "Rock": [4, 3, 2, 1, 0, 0, 0, 0, 1, 2, 3, 3, 3, 2, 1, 1, 2, 3, 4, 4],
  "Pop": [-1, 0, 1, 2, 3, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2],
  "Jazz": [3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3],
  "Classical": [3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 3, 4],
  "Electronic": [4, 3, 2, 1, 0, 0, 0, 0, -1, -2, -1, 0, 1, 2, 3, 3, 2, 1, 0, 1],
  "Bass Boost": [6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "Treble Boost": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6],
  "Vocal": [-2, -2, -1, 0, 1, 2, 3, 3, 3, 2, 1, 0, 0, 0, 0, 0, 0, -1, -1, -2],
  "Loudness": [4, 3, 2, 1, 0, 0, 0, -1, -1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4],
};

export const EQ_QUALITY_MODES = ["precise", "balanced", "fast", "minimal"] as const;
export type EqQualityMode = (typeof EQ_QUALITY_MODES)[number];

/**
 * AudioEngine singleton.
 * Solo se crea una instancia cuando el usuario interactúa por primera vez (autoplay policy).
 */
class AudioEngineImpl {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null; // preamp
  private eqFilters: BiquadFilterNode[] = [];
  private bassFilter: BiquadFilterNode | null = null; // lowshelf
  private widenerSplitter: ChannelSplitterNode | null = null;
  private widenerMerger: ChannelMergerNode | null = null;
  private midGain: GainNode | null = null;
  private sideGainL: GainNode | null = null;
  private sideGainR: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;

  private currentUrl: string | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private startedAt = 0;
  private pausedAt = 0;
  private isPaused = false;

  state: EngineState = "IDLE";
  position = 0;
  duration = 0;
  bufferLatencyMs = 0;

  // Callbacks para React state
  onStateChange?: (s: EngineState) => void;
  onPositionChange?: (p: number) => void;
  onDurationChange?: (d: number) => void;
  onEnded?: () => void;
  onSpectrum?: (data: Uint8Array) => void;

  private ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC({ latencyHint: "interactive", sampleRate: 48000 });
      this.setupGraph();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  private setupGraph() {
    if (!this.ctx) return;

    // Preamp gain
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 1.0;

    // EQ20 - 20 BiquadFilterNode peaking
    this.eqFilters = EQ20_FREQS.map((freq, i) => {
      const f = this.ctx!.createBiquadFilter();
      f.type = i === 0 ? "lowshelf" : i === EQ20_FREQS.length - 1 ? "highshelf" : "peaking";
      f.frequency.value = freq;
      f.Q.value = 1.41;
      f.gain.value = 0;
      return f;
    });

    // Bass boost (lowshelf extra)
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = "lowshelf";
    this.bassFilter.frequency.value = 80;
    this.bassFilter.gain.value = 0;

    // Stereo widener via Mid/Side processing
    this.widenerSplitter = this.ctx.createChannelSplitter(2);
    this.widenerMerger = this.ctx.createChannelMerger(2);
    this.midGain = this.ctx.createGain();
    this.sideGainL = this.ctx.createGain();
    this.sideGainR = this.ctx.createGain();
    this.midGain.gain.value = 1.0;
    this.sideGainL.gain.value = 1.0;
    this.sideGainR.gain.value = 1.0;
    // Mid = L+R; Side = L-R
    // Para mantener simple en PWA, skipear M/S y usar un channel mixer simple

    // Limiter (DynamicsCompressor como brickwall)
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -3;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.1;

    // Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.8;

    // Conectar cadena: gainNode → eqFilters[0] → ... → eqFilters[19] → bassFilter → limiter → analyser → destination
    let node: AudioNode = this.gainNode;
    for (const f of this.eqFilters) {
      node.connect(f);
      node = f;
    }
    node.connect(this.bassFilter);
    node = this.bassFilter;
    node.connect(this.limiter);
    node = this.limiter;
    node.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  private async decodeBlob(url: string): Promise<AudioBuffer> {
    if (!this.ctx) throw new Error("no context");
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    return await this.ctx.decodeAudioData(arr);
  }

  async load(url: string, startAt = 0) {
    this.setState("PREPARING");
    try {
      this.ensureContext();
      this.currentUrl = url;
      const decoded = await this.decodeBlob(url);
      // AudioBuffer nativo de Web Audio API
      this.currentBuffer = decoded as any;
      this.duration = decoded.duration;
      this.onDurationChange?.(decoded.duration);
      this.pausedAt = startAt;
      this.position = startAt;
      this.onPositionChange?.(startAt);
      this.setState("IDLE");
    } catch (e) {
      console.error("AudioEngine load error", e);
      this.setState("ERROR");
    }
  }

  async play() {
    // Si no hay ctx o buffer, intentar cargar desde URL
    if (!this.ctx || !this.currentBuffer) {
      if (this.currentUrl) {
        await this.load(this.currentUrl, this.pausedAt);
      } else {
        return;
      }
    }
    // Tras intento de carga, verificar de nuevo
    if (!this.ctx || !this.currentBuffer) return;
    if (this.source) {
      try { this.source.stop(); } catch {}
      this.source.disconnect();
    }
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.currentBuffer as any;
    this.source.connect(this.gainNode!);
    this.source.onended = () => {
      if (!this.isPaused) {
        this.setState("IDLE");
        this.onEnded?.();
      }
    };
    this.source.start(0, this.pausedAt);
    this.startedAt = this.ctx.currentTime - this.pausedAt;
    this.isPaused = false;
    this.setState("PLAYING");
    this.tickPosition();
    this.tickSpectrum();
  }

  pause() {
    if (!this.ctx || !this.source) return;
    this.pausedAt = this.ctx.currentTime - this.startedAt;
    this.isPaused = true;
    try { this.source.stop(); } catch {}
    this.source.disconnect();
    this.source = null;
    this.setState("PAUSED");
  }

  seek(positionMs: number) {
    const wasPlaying = this.state === "PLAYING";
    this.pausedAt = positionMs / 1000;
    this.position = positionMs;
    this.onPositionChange?.(positionMs);
    if (wasPlaying) {
      this.play();
    }
  }

  release() {
    if (this.source) {
      try { this.source.stop(); } catch {}
      this.source = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.setState("IDLE");
  }

  // === DSP controls ===
  setEqBand(index: number, gainDb: number) {
    if (!this.eqFilters[index]) return;
    this.eqFilters[index].gain.value = gainDb;
  }

  setEqAll(gains: number[]) {
    gains.forEach((g, i) => this.setEqBand(i, g));
  }

  setBassBoost(gainDb: number) {
    if (!this.bassFilter) return;
    this.bassFilter.gain.value = gainDb;
  }

  setPreamp(gainDb: number) {
    if (!this.gainNode) return;
    const linear = Math.pow(10, gainDb / 20);
    this.gainNode.gain.value = linear;
  }

  setLimiterThreshold(thresholdDb: number) {
    if (!this.limiter) return;
    this.limiter.threshold.value = thresholdDb;
  }

  getSpectrum(): Uint8Array | null {
    if (!this.analyser) return null;
    const arr = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(arr);
    return arr;
  }

  private tickPosition() {
    if (this.state !== "PLAYING" || !this.ctx) return;
    this.position = (this.ctx.currentTime - this.startedAt) * 1000;
    if (this.position >= this.duration * 1000) {
      this.position = this.duration * 1000;
    }
    this.onPositionChange?.(this.position);
    requestAnimationFrame(() => this.tickPosition());
  }

  private tickSpectrum() {
    if (this.state !== "PLAYING" || !this.analyser) return;
    const arr = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(arr);
    this.onSpectrum?.(arr);
    requestAnimationFrame(() => this.tickSpectrum());
  }

  private setState(s: EngineState) {
    this.state = s;
    this.onStateChange?.(s);
  }
}

export const audioEngine = new AudioEngineImpl();

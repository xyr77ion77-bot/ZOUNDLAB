"use client";

import { useEffect, useRef } from "react";

interface SpectrumProps {
  data: Uint8Array | null;
  isPlaying: boolean;
}

export function Spectrum({ data, isPlaying }: SpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const w = canvas.width = canvas.offsetWidth * 2;
      const h = canvas.height = canvas.offsetHeight * 2;
      ctx.clearRect(0, 0, w, h);

      if (!data || !isPlaying) {
        // Estado idle: 20 bars planas
        const barCount = 48;
        const barWidth = w / barCount;
        for (let i = 0; i < barCount; i++) {
          const barHeight = 8 + Math.sin(Date.now() / 800 + i * 0.3) * 4;
          ctx.fillStyle = "rgba(125, 125, 125, 0.4)";
          ctx.fillRect(i * barWidth + 2, h / 2 - barHeight / 2, barWidth - 4, barHeight);
        }
      } else {
        const barCount = 48;
        const barWidth = w / barCount;
        const step = Math.floor(data.length / barCount);
        for (let i = 0; i < barCount; i++) {
          const v = data[i * step] / 255;
          const barHeight = Math.max(2, v * h * 0.9);
          const hue = 280 - (i / barCount) * 60; // violeta → cyan
          const gradient = ctx.createLinearGradient(0, h - barHeight, 0, h);
          gradient.addColorStop(0, `hsl(${hue}, 70%, 55%)`);
          gradient.addColorStop(1, `hsl(${hue + 20}, 60%, 45%)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(i * barWidth + 2, h - barHeight, barWidth - 4, barHeight);
        }
      }
      requestAnimationFrame(render);
    };
    render();
  }, [data, isPlaying]);

  return (
    <canvas ref={canvasRef} className="w-full h-full block" />
  );
}

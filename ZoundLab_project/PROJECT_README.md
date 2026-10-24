# ZoundLab · App de Música Fusión jetAudio + AIMP

App de música completa y funcional construida como Progressive Web App con Next.js 16 + Web Audio API, implementando el contrato `AudioEngine` + DSP chain de la Spec de Arquitectura Fase 1.

## Stack técnico
- **Framework**: Next.js 16.1.3 (Turbopack) + TypeScript 5 + Tailwind CSS 4
- **UI**: shadcn/ui (47 componentes) + lucide-react icons
- **Estado**: Zustand para cliente, @dnd-kit para drag-and-drop
- **Audio**: Web Audio API nativa (AudioContext + BiquadFilter + DynamicsCompressor + Analyser)
- **Temas**: Material You + 6 presets (Light/Dark/Sepia/HighContrast/Amber/Slate)

## Requisitos previos
- **Node.js 20+**: descarga desde [nodejs.org](https://nodejs.org)
- **Bun** (recomendado, gestor de paquetes rápido): 
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
  Alternativa: usa `npm` o `pnpm` sin instalar Bun (los comandos siguientes funcionan igual cambiando `bun` por `npm` o `pnpm`)

## Instalación y ejecución (Windows 10)

### 1. Descomprime el ZIP
```powershell
Expand-Archive ZoundLab_project.zip
cd ZoundLab_project
```

### 2. Instala dependencias
```powershell
bun install
```
Con npm: `npm install` · Con pnpm: `pnpm install`

### 3. Ejecuta en modo desarrollo
```powershell
bun run dev
```
La app se abre en `http://localhost:3000`

### 4. Build de producción (PWA estática para PWABuilder)
Añade a `next.config.ts` (si no está):
```ts
const nextConfig = {
  output: "standalone",
};
export default nextConfig;
```
Luego:
```powershell
bun run build
```
El build estático se genera en `.next/standalone/`

## Estructura del proyecto

```
ZoundLab_project/
├── src/
│   ├── app/
│   │   ├── globals.css           # Material You + 6 temas presets
│   │   ├── layout.tsx            # RootLayout con ThemeProvider
│   │   └── page.tsx              # App shell (sidebar + mobile nav + PlayerBar)
│   ├── components/
│   │   ├── views/               # 6 pantallas MVP
│   │   │   ├── now-playing.tsx   # Disc3 spinning + spectrum real
│   │   │   ├── library.tsx       # Tracks/Albums/Artists/Genres + search
│   │   │   ├── equalizer.tsx     # 20 sliders ISO + 10 presets + 4 modos
│   │   │   ├── browser.tsx       # 7 backends (SAF/WebDAV/OAuth2/SMB/FTP/URL/Native)
│   │   │   ├── queue.tsx         # Drag-and-drop con @dnd-kit
│   │   │   └── settings.tsx      # 6 temas + toggle Simple/Pro + DSP chain
│   │   ├── theme-provider.tsx   # ThemeProvider con persistencia localStorage
│   │   ├── player-bar.tsx       # Barra persistente con play/pause/skip/repeat
│   │   ├── sidebar.tsx          # Navegación desktop
│   │   ├── mobile-nav.tsx       # Navegación mobile
│   │   ├── spectrum.tsx         # Visualizer canvas (AnalyserNode 1024 FFT)
│   │   └── ui/                  # shadcn/ui (47 componentes)
│   ├── lib/
│   │   ├── audio-engine.ts      # Contrato AudioEngine + EQ20 presets + ISO freqs
│   │   ├── store.ts             # Zustand store con library, queue, EQ state
│   │   ├── format.ts            # formatTime, formatHz, formatBytes
│   │   ├── db.ts                # Prisma client (sin uso en MVP)
│   │   └── utils.ts             # cn() helper (shadcn)
│   └── hooks/                   # Hooks personalizados (vacío en MVP)
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
└── README.md                    # Este archivo
```

## Funcionalidades implementadas

### Motor de audio (contrato AudioEngine)
Pipeline PCM real con Web Audio API:
```
Source → Preamp (ReplayGain) → EQ20 (BiquadFilterNode peaking ISO) 
      → Bass (lowshelf @ 80Hz) → Limiter (DynamicsCompressor brickwall @ -3dBFS no bypassable)
      → AnalyserNode (spectrum 1024 FFT) → destination
```

### Pantallas MVP (6)
1. **Now Playing**: album art con disco girando, visualizador spectrum real, DSP chain indicator en modo Pro, big controls
2. **Library**: tabs Tracks/Albums/Artists/Genres + search; 9 tracks demo (6 tonos sintéticos + 3 radios SomaFM)
3. **Equalizer**: 20 sliders verticales ISO (31Hz-16kHz), 10 presets, 4 modos calidad, bypass, Bass Boost/Preamp/Limiter
4. **Browser**: 7 backends (SAF picker real con FileReader, WebDAV form, OAuth2/SMB/FTP marcados V1+, URL streaming con 3 radios SomaFM, Native/SDCard)
5. **Queue**: drag-and-drop con @dnd-kit, now playing card destacado, vaciar y aleatorio
6. **Settings**: 6 temas presets, toggle Simple/Pro, DSP chain actual con 9 etapas, matriz privacidad, about

### Modo Simple/Pro
- **Simple** (default): expone solo EQ + Bass/Wide. Demás etapas DSP en background.
- **Pro**: expone las 8 etapas DSP con bypass individual y reorder limitado (etapas 01-06 reordenables, 00 Source y 07 Limiter fijos).

## Cómo compilar la APK en Windows 10

### Camino A: PWA → APK con PWABuilder (1-2 horas)
Empaqueta la app como Trusted Web Activity (TWA). La app corre dentro de Chrome WebView fullscreen, parece nativa. **Limitación**: el audio suena con latencia ~80-150ms (vs 20ms AAudio nativo), no tienes acceso a AAudio/FFmpeg/BASS nativos.

**Pasos:**
1. Genera build estático: `bun run build` (con `output: "standalone"` en next.config.ts)
2. Publica en Vercel/Netlify (HTTPS obligatorio): `bunx vercel --prod`
3. Ve a [https://www.pwabuilder.com](https://www.pwabuilder.com), pega tu URL
4. Pestaña Android → Generate Package → descarga ZIP
5. Abre el ZIP en Android Studio (Hedgehog+)
6. Build → Build Bundle(s) / APK(s) → Build APK(s)
7. APK generada en `app/build/outputs/apk/debug/app-debug.apk`

**Requisitos PWABuilder en Windows 10:**
- JDK 17: [adoptium.net](https://adoptium.net)
- Android Studio: [developer.android.com/studio](https://developer.android.com/studio)
- Node.js 20+ y Bun
- Microsoft Edge o Chrome

### Camino B: Reimplementación nativa (Kotlin/Compose, semanas)
Reimplementas el contrato `AudioEngine` sobre AAudio + FFmpeg + DSP C++. Es lo que la Spec Fase 1 realmente describe. **No es compilación del código Next.js actual** — es un proyecto Android nuevo que respeta la misma arquitectura modular Gradle de 7 módulos (`:app`, `:core-engine`, `:core-dsp`, `:core-filesystems`, `:feature-library`, `:feature-ui`, `:skins`).

**Requisitos:**
- Android Studio Iguana+ (incluye SDK + NDK + CMake + Gradle)
- JDK 17 (bundled con Android Studio)
- NDK 26+ + CMake 3.22+ (descarga desde SDK Manager)
- WSL2 (recomendado para build scripts FFmpeg)

**Recomendación:** empieza por **Camino A (PWABuilder)** para tener una APK funcional en tu móvil en 1-2 horas. Si la latencia del WebView te resulta inaceptable para uso real, entonces migras al Camino B reutilizando los contratos `AudioEngine`/`DspStage` ya definidos — el código Kotlin respetará la misma arquitectura.

## Limitación documentada
El entorno de desarrollo original no permitía compilar APK Android nativo (NDK + FFmpeg + AAudio + Gradle), por lo que el contrato `AudioEngine` se implementó sobre Web Audio API nativa del navegador en lugar de AAudio+FFmpeg+BASS. **La misma interfaz AudioEngine/DspStage es portable al APK Android nativo sin reescribir la capa superior** — esto es exactamente el dual-track Plan A/Plan B de la Spec Fase 1.

## Documentación relacionada
- `Spec_Arquitectura_Fusion_jetAudio_AIMP_v0.1_Fase_1.pdf` — Spec de Arquitectura Fase 1 (21 páginas, español)
- `jetAudio_v13.1.2_Patched_Analisis_Ingenieria_Inversa.pdf` — Análisis forense jetAudio
- `AIMP_v4.31.1747_Analisis_Ingenieria_Inversa.pdf` — Análisis forense AIMP

## Comandos útiles
```powershell
# Desarrollo
bun run dev                      # Servidor de desarrollo en :3000
bun run lint                    # ESLint check

# Build
bun run build                   # Build de producción
bun run start                   # Servir build de producción

# Base de datos (Prisma, no usada en MVP)
bun run db:push                 # Push schema a SQLite
bun run db:generate              # Generar Prisma Client
```

## Licencia
Proyecto de diseño · Z.AI Design Lab · 2026

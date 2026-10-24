"use client";

import { useApp, Track } from "@/lib/store";
import { Folder, Cloud, Globe, HardDrive, Radio, Upload, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";

type Backend = "saf" | "webdav" | "oauth2" | "smb" | "ftp" | "url" | "native";

const BACKENDS: { id: Backend; label: string; icon: React.ElementType; mvp: boolean; description: string }[] = [
  { id: "saf", label: "Archivos locales (SAF)", icon: HardDrive, mvp: true, description: "Picker nativo del sistema, soporta cualquier formato de audio soportado por el navegador: MP3, FLAC, AAC, OGG, OPUS, WAV" },
  { id: "url", label: "URL streaming (radio)", icon: Radio, mvp: true, description: "Reproduce streams HTTP/HTTPS en vivo. Demo con 3 radios SomaFM ambient" },
  { id: "webdav", label: "WebDAV", icon: Cloud, mvp: true, description: "Conexión a servidores WebDAV: Nextcloud, Mail.ru, OpenDrive. Configura servidor, usuario y contraseña" },
  { id: "oauth2", label: "OAuth2 (Dropbox/Drive/OneDrive)", icon: Cloud, mvp: false, description: "Autenticación OAuth2 con Chrome Custom Tab y PKCE. Disponible en V1" },
  { id: "smb", label: "Samba (SMB/CIFS)", icon: Folder, mvp: false, description: "Comparticiones Windows y Samba. Autenticación NTLMSSP. Disponible en V1" },
  { id: "ftp", label: "FTP / SFTP", icon: Upload, mvp: false, description: "Conexión FTP/FTPS/SFTP con autenticación clave pública. Disponible en V1" },
  { id: "native", label: "Native / SDCard", icon: HardDrive, mvp: true, description: "Acceso directo a la tarjeta SD vía SAF. Igual que 'Archivos locales' en este demo" },
];

export function BrowserView() {
  const { playTrack, library } = useApp();
  const [activeBackend, setActiveBackend] = useState<Backend>("saf");
  const [files, setFiles] = useState<Track[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL form state
  const [urlInput, setUrlInput] = useState("");
  const [urlTitle, setUrlTitle] = useState("");

  // WebDAV form state
  const [webdavServer, setWebdavServer] = useState("");
  const [webdavUser, setWebdavUser] = useState("");
  const [webdavPass, setWebdavPass] = useState("");

  const demoTracks = useMemo(() => library.filter((t) => t.source === "demo"), [library]);
  const radioTracks = useMemo(() => library.filter((t) => t.source === "url"), [library]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files;
    if (!fl) return;
    const newTracks: Track[] = [];
    for (let i = 0; i < fl.length; i++) {
      const f = fl[i];
      // Solo ficheros de audio (el navegador es lo que dicta qué puede decodificar)
      if (!f.type.startsWith("audio/") && !/\.(mp3|flac|ogg|opus|wav|m4a|aac|wv|ape)$/i.test(f.name)) continue;
      newTracks.push({
        id: `local-${f.name}-${i}-${Date.now()}`,
        title: f.name.replace(/\.[^.]+$/, ""),
        artist: "Archivo local",
        album: "Subido vía SAF",
        duration: 0,
        url: URL.createObjectURL(f),
        source: "file",
        format: (f.name.split(".").pop() ?? "FILE").toUpperCase(),
      });
    }
    setFiles((prev) => [...prev, ...newTracks]);
    toast.success(`${newTracks.length} tracks añadidos`);
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const newTrack: Track = {
      id: `url-${Date.now()}`,
      title: urlTitle.trim() || "URL stream",
      artist: "Custom URL",
      album: "URL streaming",
      duration: 0,
      url: urlInput.trim(),
      source: "url",
      format: "HTTP stream",
    };
    setFiles((prev) => [newTrack, ...prev]);
    setUrlInput("");
    setUrlTitle("");
    toast.success("Stream añadido");
  };

  return (
    <div className="min-h-full p-4 md:p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Browser multi-protocolo</h1>
        <p className="text-sm text-muted-foreground">
          7 backends · Streaming-first · FileSystemProvider abstraction
        </p>
      </div>

      {/* Backend selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {BACKENDS.map((b) => {
          const Icon = b.icon;
          const active = activeBackend === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setActiveBackend(b.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent/50",
                !b.mvp && "opacity-60"
              )}
              title={b.description}
            >
              <Icon className="w-5 h-5" />
              <div className="text-xs font-medium">{b.label}</div>
              {!b.mvp && (
                <span className="text-[9px] text-amber-600 dark:text-amber-400 uppercase tracking-wider">V1+</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Backend content */}
      <div className="rounded-lg border border-border bg-card p-4">
        {activeBackend === "saf" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <HardDrive className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Archivos locales (SAF / MediaStore)</div>
                <div className="text-sm text-muted-foreground mb-3">
                  {BACKENDS[0].description}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.flac,.ogg,.opus,.wav,.m4a,.aac,.wv,.ape"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                >
                  <Upload className="w-4 h-4" />
                  Seleccionar archivos
                </button>
              </div>
            </div>

            {files.length > 0 && (
              <div className="border-t border-border pt-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Archivos cargados ({files.length})
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {files.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => playTrack(t, files)}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 text-left"
                    >
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-primary/40 to-chart-2/40 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground">{t.format} · {t.source}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-3 mt-1">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Tracks de demo (sintéticos · validan EQ)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {demoTracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => playTrack(t, demoTracks)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 text-left"
                  >
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {t.format}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground">{t.genre} · {t.duration}s</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeBackend === "url" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Radio className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">URL streaming (radio)</div>
                <div className="text-sm text-muted-foreground mb-3">
                  {BACKENDS[1].description}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="https://stream-url.mp3"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-md border border-input bg-background text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Título (opcional)"
                    value={urlTitle}
                    onChange={(e) => setUrlTitle(e.target.value)}
                    className="sm:w-48 px-3 py-1.5 rounded-md border border-input bg-background text-sm"
                  />
                  <button
                    onClick={handleAddUrl}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                  >
                    <Plus className="w-4 h-4" /> Añadir
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Radios SomaFM (streams públicos)
              </div>
              <div className="space-y-1">
                {radioTracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => playTrack(t, radioTracks)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 text-left"
                  >
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-chart-1 via-chart-4 to-chart-2 shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
                      FM
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground">{t.format} · {t.genre}</div>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">∞</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeBackend === "webdav" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold">WebDAV</div>
                <div className="text-sm text-muted-foreground">{BACKENDS[2].description}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Servidor</label>
                <input
                  type="text"
                  placeholder="https://nextcloud.example.com/remote.php/dav/files/user"
                  value={webdavServer}
                  onChange={(e) => setWebdavServer(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-md border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Usuario</label>
                <input
                  type="text"
                  value={webdavUser}
                  onChange={(e) => setWebdavUser(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-md border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Contraseña</label>
                <input
                  type="password"
                  value={webdavPass}
                  onChange={(e) => setWebdavPass(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-md border border-input bg-background text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => toast.info("WebDAV requiere backend HTTP. En el APK Android se integra con sardine-android.")}
              className="self-start flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              <Globe className="w-4 h-4" /> Conectar
            </button>
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 mt-2">
              <strong>Nota:</strong> En el navegador no se puede hacer CORS a un servidor WebDAV arbitrario
              sin configurar CORS en el servidor. En el APK Android, <code className="font-mono">sardine-android</code>
              {" "}gestiona esto sin restricciones.
            </div>
          </div>
        )}

        {activeBackend === "oauth2" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold">OAuth2 (Dropbox / Google Drive / OneDrive)</div>
                <div className="text-sm text-muted-foreground">{BACKENDS[3].description}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["Dropbox", "Google Drive", "OneDrive"].map((p) => (
                <button
                  key={p}
                  onClick={() => toast.info(`OAuth2 ${p} se implementará en V1 con AppAuth-Android + PKCE`)}
                  className="p-4 rounded-lg border border-border hover:bg-accent/50 flex flex-col items-center gap-2"
                >
                  <Cloud className="w-6 h-6 text-muted-foreground" />
                  <div className="text-xs font-medium">{p}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeBackend === "smb" && (
          <div className="flex flex-col gap-3 items-start">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Folder className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold">Samba (SMB/CIFS)</div>
                <div className="text-sm text-muted-foreground">{BACKENDS[4].description}</div>
              </div>
            </div>
            <button
              onClick={() => toast.info("Samba se integrará en V1 con smbj (NTLMSSP)")}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Configurar SMB
            </button>
          </div>
        )}

        {activeBackend === "ftp" && (
          <div className="flex flex-col gap-3 items-start">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold">FTP / SFTP</div>
                <div className="text-sm text-muted-foreground">{BACKENDS[5].description}</div>
              </div>
            </div>
            <button
              onClick={() => toast.info("FTP/SFTP se integrará en V1 con JSch + Apache FTPClient")}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Configurar FTP
            </button>
          </div>
        )}

        {activeBackend === "native" && (
          <div className="flex flex-col gap-3 items-start">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold">Native / SDCard</div>
                <div className="text-sm text-muted-foreground">{BACKENDS[6].description}</div>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              <Upload className="w-4 h-4" /> Abrir SAF picker
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useApp } from "@/lib/store";
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, X, ListMusic, Shuffle, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";

function QueueItem({ id, index }: { id: string; index: number }) {
  const { queue, currentTrack, isPlaying, playTrack, removeFromQueue } = useApp();
  const track = queue[index];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  if (!track) return null;
  const isActive = currentTrack?.id === track.id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-md border transition-colors",
        isActive
          ? "border-primary bg-primary/10"
          : "border-border hover:bg-accent/50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <button
        onClick={() => playTrack(track, queue)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <div className="w-9 h-9 rounded bg-gradient-to-br from-primary/40 to-chart-2/40 shrink-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
          {track.format?.slice(0, 3) ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("text-sm font-medium truncate", isActive && "text-primary")}>
            {track.title}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {track.artist} · {track.format}
          </div>
        </div>
        {isActive && isPlaying && (
          <div className="flex gap-0.5 items-end h-3 mr-2">
            <span className="w-0.5 h-2 bg-primary animate-pulse" />
            <span className="w-0.5 h-3 bg-primary animate-pulse" style={{ animationDelay: "0.15s" }} />
            <span className="w-0.5 h-1.5 bg-primary animate-pulse" style={{ animationDelay: "0.3s" }} />
          </div>
        )}
        <div className="text-xs text-muted-foreground tabular-nums shrink-0">
          {track.duration > 0 ? formatTime(track.duration * 1000) : "∞"}
        </div>
      </button>
      <button
        onClick={() => removeFromQueue(index)}
        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        title="Quitar de la cola"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function QueueView() {
  const { queue, reorderQueue, clearQueue, currentTrack, playTrack, toggleShuffle, shuffle } = useApp();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = queue.findIndex((t) => t.id === active.id);
    const newIndex = queue.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    reorderQueue(oldIndex, newIndex);
  };

  return (
    <div className="min-h-full p-4 md:p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Cola</h1>
          <p className="text-sm text-muted-foreground">
            {queue.length} tracks en cola · Drag-and-drop para reordenar
          </p>
        </div>
        {queue.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={toggleShuffle}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium",
                shuffle
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent"
              )}
            >
              <Shuffle className="w-4 h-4" />
              {shuffle ? "Aleatorio on" : "Aleatorio off"}
            </button>
            <button
              onClick={clearQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-destructive/50 text-destructive bg-destructive/10 hover:bg-destructive/20 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Vaciar
            </button>
          </div>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <ListMusic className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <div className="text-lg font-semibold mb-1">Cola vacía</div>
            <div className="text-sm text-muted-foreground max-w-md">
              Reproduce un track desde la Biblioteca o el Browser para añadirlo a la cola.
            </div>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={queue.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {queue.map((t, i) => (
                <QueueItem key={t.id} id={t.id} index={i} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Now playing card */}
      {currentTrack && (
        <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <div className="text-xs uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
            <Play className="w-3 h-3" /> Reproduciendo ahora
          </div>
          <button
            onClick={() => playTrack(currentTrack, queue)}
            className="w-full flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded bg-gradient-to-br from-primary via-chart-4 to-chart-2 shrink-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
              {currentTrack.format?.slice(0, 3) ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{currentTrack.title}</div>
              <div className="text-xs text-muted-foreground truncate">
                {currentTrack.artist} · {currentTrack.format}
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

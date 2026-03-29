import { useState, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import {
  fetchPlots, addPlot, addBed, updateBed, deleteBedApi, deletePlotApi,
  type PlotData, type BedData, type PlantSlot,
} from "@/api/plots";

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE: NonNullable<PlantSlot>[] = [
  { emoji: "🍅", name: "Томаты",    color: "#c0392b" },
  { emoji: "🥕", name: "Морковь",   color: "#e67e22" },
  { emoji: "🥬", name: "Салат",     color: "#27ae60" },
  { emoji: "🥒", name: "Огурцы",    color: "#2ecc71" },
  { emoji: "🧅", name: "Лук",       color: "#9b59b6" },
  { emoji: "🌽", name: "Кукуруза",  color: "#f1c40f" },
  { emoji: "🫑", name: "Перец",     color: "#e74c3c" },
  { emoji: "🥦", name: "Брокколи",  color: "#1a7a4a" },
  { emoji: "🌿", name: "Зелень",    color: "#45b39d" },
  { emoji: "🫛", name: "Горох",     color: "#58d68d" },
  { emoji: "🧄", name: "Чеснок",    color: "#8e6f3e" },
  { emoji: "🥔", name: "Картофель", color: "#a0522d" },
];

const BED_COLORS = ["#8B6914","#5a7a3a","#7a4a2a","#3a6b5a","#6b3a5a","#4a5a7a"];

function makeId() { return Math.random().toString(36).slice(2, 9); }

// ─── Debounce ─────────────────────────────────────────────────────────────────

function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GardenPlanEditor() {
  const [plots, setPlots] = useState<PlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlotId, setActivePlotId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");

  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedCellIdx, setSelectedCellIdx] = useState<number | null>(null);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  const [showAddBed, setShowAddBed] = useState(false);
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [newPlotName, setNewPlotName] = useState("");
  const [newBed, setNewBed] = useState({ name: "", cols: 3, rows: 2 });
  const [editBedId, setEditBedId] = useState<string | null>(null);

  const dragging = useRef<{ bedId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizing = useRef<{ bedId: string; startX: number; startY: number; origW: number; origH: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchPlots()
      .then(data => {
        setPlots(data);
        if (data.length > 0) setActivePlotId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const activePlot = plots.find(p => p.id === activePlotId) ?? null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const updateLocalBed = useCallback((bedId: string, updater: (b: BedData) => BedData) => {
    setPlots(prev => prev.map(p => ({
      ...p,
      beds: p.beds.map(b => b.id === bedId ? updater(b) : b),
    })));
  }, []);

  const saveBed = useDebounce((bed: BedData) => { updateBed(bed); }, 600);

  // ── Canvas coords ─────────────────────────────────────────────────────────

  const getCanvasPos = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { px: 0, py: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      px: ((clientX - rect.left) / rect.width) * 100,
      py: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  // ── Drag ──────────────────────────────────────────────────────────────────

  const onPointerDown = (e: React.PointerEvent, bedId: string) => {
    if (mode !== "edit") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { px, py } = getCanvasPos(e.clientX, e.clientY);
    const bed = activePlot?.beds.find(b => b.id === bedId);
    if (!bed) return;
    dragging.current = { bedId, startX: px, startY: py, origX: bed.x, origY: bed.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current && mode === "edit") {
      const { px, py } = getCanvasPos(e.clientX, e.clientY);
      const dx = px - dragging.current.startX;
      const dy = py - dragging.current.startY;
      const newX = Math.max(0, Math.min(78, dragging.current.origX + dx));
      const newY = Math.max(0, Math.min(82, dragging.current.origY + dy));
      const bedId = dragging.current.bedId;
      updateLocalBed(bedId, b => {
        const updated = { ...b, x: newX, y: newY };
        saveBed(updated);
        return updated;
      });
    }
    if (resizing.current) {
      const { px, py } = getCanvasPos(e.clientX, e.clientY);
      const dx = px - resizing.current.startX;
      const dy = py - resizing.current.startY;
      const newW = Math.max(12, Math.min(60, resizing.current.origW + dx));
      const newH = Math.max(8, Math.min(50, resizing.current.origH + dy));
      const bedId = resizing.current.bedId;
      updateLocalBed(bedId, b => {
        const updated = { ...b, w: newW, h: newH };
        saveBed(updated);
        return updated;
      });
    }
  };

  const onPointerUp = () => { dragging.current = null; resizing.current = null; };

  const onResizeDown = (e: React.PointerEvent, bedId: string) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const { px, py } = getCanvasPos(e.clientX, e.clientY);
    const bed = activePlot?.beds.find(b => b.id === bedId);
    if (!bed) return;
    resizing.current = { bedId, startX: px, startY: py, origW: bed.w, origH: bed.h };
  };

  // ── Plant picker ──────────────────────────────────────────────────────────

  const openCellPicker = (bedId: string, idx: number) => {
    if (mode === "edit") return;
    setSelectedBedId(bedId);
    setSelectedCellIdx(idx);
    setShowPlantPicker(true);
  };

  const assignPlant = (plant: PlantSlot) => {
    if (!selectedBedId || selectedCellIdx === null) return;
    let updatedBed: BedData | null = null;
    updateLocalBed(selectedBedId, b => {
      const cells = [...b.cells];
      cells[selectedCellIdx] = plant;
      updatedBed = { ...b, cells };
      return updatedBed;
    });
    setTimeout(() => { if (updatedBed) updateBed(updatedBed); }, 0);
    setShowPlantPicker(false);
  };

  // ── Add bed ───────────────────────────────────────────────────────────────

  const handleAddBed = async () => {
    if (!newBed.name.trim() || !activePlotId) return;
    const cellCount = newBed.cols * newBed.rows;
    const bed: BedData = {
      id: makeId(),
      plot_id: activePlotId,
      name: newBed.name,
      x: 10, y: 10,
      w: newBed.cols * 7 + 4,
      h: newBed.rows * 8 + 4,
      cols: newBed.cols,
      rows: newBed.rows,
      color: BED_COLORS[Math.floor(Math.random() * BED_COLORS.length)],
      cells: Array(cellCount).fill(null),
    };
    setPlots(prev => prev.map(p => p.id === activePlotId ? { ...p, beds: [...p.beds, bed] } : p));
    setNewBed({ name: "", cols: 3, rows: 2 });
    setShowAddBed(false);
    await addBed(bed);
  };

  // ── Delete bed ────────────────────────────────────────────────────────────

  const handleDeleteBed = async (bedId: string) => {
    setPlots(prev => prev.map(p => ({ ...p, beds: p.beds.filter(b => b.id !== bedId) })));
    setEditBedId(null);
    await deleteBedApi(bedId);
  };

  // ── Add plot ──────────────────────────────────────────────────────────────

  const handleAddPlot = async () => {
    if (!newPlotName.trim()) return;
    const id = makeId();
    const plot: PlotData = { id, name: newPlotName, beds: [] };
    setPlots(prev => [...prev, plot]);
    setActivePlotId(id);
    setNewPlotName("");
    setShowAddPlot(false);
    await addPlot(id, newPlotName);
  };

  // ── Delete plot ───────────────────────────────────────────────────────────

  const handleDeletePlot = async (plotId: string) => {
    const remaining = plots.filter(p => p.id !== plotId);
    setPlots(remaining);
    setActivePlotId(remaining.length > 0 ? remaining[0].id : null);
    await deletePlotApi(plotId);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const allCells = activePlot?.beds.flatMap(b => b.cells) ?? [];
  const planted = allCells.filter(Boolean).length;
  const total = allCells.length;
  const cultures = new Set(allCells.filter(Boolean).map(c => c!.name)).size;

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3 mt-2">
        <div className="h-8 bg-muted/50 rounded-full w-2/3 animate-pulse" />
        <div className="h-20 bg-muted/50 rounded-2xl animate-pulse" />
        <div className="h-64 bg-muted/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-2">

      {/* Plot tabs */}
      <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
        {plots.map(p => (
          <div key={p.id} className="flex-shrink-0 relative group">
            <button
              onClick={() => setActivePlotId(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-body font-medium whitespace-nowrap transition-all ${
                activePlotId === p.id ? "bg-moss text-white shadow-sm pr-7" : "bg-card border border-border text-muted-foreground pr-3"
              }`}
            >
              {p.name}
            </button>
            {plots.length > 1 && activePlotId === p.id && (
              <button
                onClick={() => handleDeletePlot(p.id)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/20 text-white/70 transition-opacity"
              >
                <Icon name="X" size={9} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setShowAddPlot(true)}
          className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
        >
          <Icon name="Plus" size={13} />
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-2">
        {[
          { label: "Засажено", val: `${planted}/${total}`, color: "text-moss" },
          { label: "Грядок",   val: String(activePlot?.beds.length ?? 0), color: "text-earth" },
          { label: "Культур",  val: String(cultures), color: "" },
        ].map(s => (
          <div key={s.label} className="flex-1 bg-card border border-border rounded-2xl p-3">
            <p className="text-[10px] text-muted-foreground font-body">{s.label}</p>
            <p className={`text-xl font-display font-semibold ${s.color}`}
               style={!s.color ? { color: "hsl(var(--accent))" } : {}}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-body">
          {mode === "edit" ? "✏️ Перетаскивайте и меняйте размер" : "👆 Нажмите ячейку для посадки"}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => { setMode(m => m === "edit" ? "view" : "edit"); setEditBedId(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-body font-medium transition-all ${
              mode === "edit" ? "bg-moss text-white" : "bg-card border border-border text-muted-foreground"
            }`}
          >
            <Icon name={mode === "edit" ? "Check" : "Move"} size={13} />
            {mode === "edit" ? "Готово" : "Двигать"}
          </button>
          <button
            onClick={() => setShowAddBed(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="Plus" size={13} />
            Грядка
          </button>
        </div>
      </div>

      {/* ── Canvas ───────────────────────────────────────────────────────── */}
      <div
        ref={canvasRef}
        className="relative w-full rounded-2xl border-2 border-border overflow-hidden select-none"
        style={{
          height: "360px",
          background: "repeating-linear-gradient(0deg,transparent,transparent 39px,hsl(var(--border)/0.35) 39px,hsl(var(--border)/0.35) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,hsl(var(--border)/0.35) 39px,hsl(var(--border)/0.35) 40px),hsl(var(--muted))",
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {(!activePlot || activePlot.beds.length === 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground pointer-events-none">
            <span className="text-4xl">🌱</span>
            <p className="text-sm font-body">Добавьте первую грядку</p>
          </div>
        )}

        {activePlot?.beds.map(bed => (
          <div
            key={bed.id}
            className="absolute"
            style={{ left: `${bed.x}%`, top: `${bed.y}%`, width: `${bed.w}%`, height: `${bed.h}%` }}
            onPointerDown={e => onPointerDown(e, bed.id)}
          >
            <div
              className={`w-full h-full rounded-xl border-2 flex flex-col overflow-hidden transition-shadow ${
                mode === "edit" ? "cursor-grab active:cursor-grabbing shadow-lg" : "cursor-default"
              }`}
              style={{ borderColor: bed.color, backgroundColor: bed.color + "18" }}
            >
              <div
                className="flex items-center justify-between px-1.5 py-0.5 flex-shrink-0"
                style={{ backgroundColor: bed.color + "44" }}
              >
                <span className="text-[9px] font-body font-semibold text-foreground/80 truncate leading-tight">{bed.name}</span>
                {mode === "edit" && (
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setEditBedId(editBedId === bed.id ? null : bed.id); }}
                    className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/30 flex-shrink-0"
                  >
                    <Icon name="MoreVertical" size={9} className="text-foreground/70" />
                  </button>
                )}
              </div>

              <div
                className="flex-1 grid gap-0.5 p-0.5"
                style={{ gridTemplateColumns: `repeat(${bed.cols}, 1fr)` }}
              >
                {bed.cells.map((cell, idx) => (
                  <button
                    key={idx}
                    onPointerDown={e => e.stopPropagation()}
                    onClick={() => openCellPicker(bed.id, idx)}
                    disabled={mode === "edit"}
                    className={`rounded flex items-center justify-center transition-all ${
                      mode === "edit" ? "pointer-events-none" :
                      cell ? "hover:brightness-95" : "hover:bg-white/40 border border-dashed border-white/30"
                    }`}
                    style={cell ? { backgroundColor: cell.color + "33" } : {}}
                    title={cell?.name}
                  >
                    {cell
                      ? <span style={{ fontSize: "clamp(8px,1.8vw,16px)" }}>{cell.emoji}</span>
                      : <span style={{ fontSize: "clamp(6px,1vw,10px)" }} className="text-white/30">+</span>
                    }
                  </button>
                ))}
              </div>
            </div>

            {mode === "edit" && (
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10"
                style={{ background: `linear-gradient(135deg,transparent 50%,${bed.color} 50%)`, borderRadius: "0 0 10px 0" }}
                onPointerDown={e => { e.stopPropagation(); onResizeDown(e, bed.id); }}
              />
            )}

            {editBedId === bed.id && mode === "edit" && (
              <div
                className="absolute top-7 right-0 z-20 bg-card border border-border rounded-xl shadow-xl p-1 min-w-[120px]"
                onPointerDown={e => e.stopPropagation()}
              >
                <button onClick={() => setEditBedId(null)} className="w-full text-left px-3 py-1.5 text-xs font-body rounded-lg hover:bg-muted transition-colors flex items-center gap-2">
                  <Icon name="Check" size={12} />Готово
                </button>
                <button onClick={() => handleDeleteBed(bed.id)} className="w-full text-left px-3 py-1.5 text-xs font-body rounded-lg hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2">
                  <Icon name="Trash2" size={12} />Удалить
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Legend */}
        {(activePlot?.beds.length ?? 0) > 0 && (
          <div className="absolute bottom-2 right-2 flex flex-col gap-0.5 pointer-events-none">
            {[...new Set(allCells.filter(Boolean).map(c => c!.name))].slice(0, 5).map(name => {
              const p = PALETTE.find(pl => pl.name === name);
              return p ? (
                <div key={name} className="flex items-center gap-1 bg-card/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                  <span style={{ fontSize: 10 }}>{p.emoji}</span>
                  <span className="text-[9px] font-body text-foreground/70">{name}</span>
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* ── Plant picker ──────────────────────────────────────────────────── */}
      {showPlantPicker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4" onClick={() => setShowPlantPicker(false)}>
          <div className="bg-card w-full max-w-md rounded-3xl p-5 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold">Выберите растение</h3>
              <button onClick={() => setShowPlantPicker(false)}><Icon name="X" size={20} className="text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PALETTE.map(plant => (
                <button key={plant.name} onClick={() => assignPlant(plant)} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors">
                  <span className="text-2xl">{plant.emoji}</span>
                  <span className="text-[9px] font-body text-muted-foreground text-center leading-tight">{plant.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => assignPlant(null)} className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm font-body hover:border-destructive/50 hover:text-destructive transition-colors">
              Очистить ячейку
            </button>
          </div>
        </div>
      )}

      {/* ── Add bed ───────────────────────────────────────────────────────── */}
      {showAddBed && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4" onClick={() => setShowAddBed(false)}>
          <div className="bg-card w-full max-w-md rounded-3xl p-5 shadow-2xl animate-scale-in space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">Новая грядка</h3>
              <button onClick={() => setShowAddBed(false)}><Icon name="X" size={20} className="text-muted-foreground" /></button>
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1 block">Название</label>
              <input
                value={newBed.name}
                onChange={e => setNewBed(p => ({ ...p, name: e.target.value }))}
                placeholder="Например: Грядка Д"
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-body text-muted-foreground mb-1 block">Столбцов: {newBed.cols}</label>
                <input type="range" min={1} max={6} value={newBed.cols} onChange={e => setNewBed(p => ({ ...p, cols: +e.target.value }))} className="w-full accent-moss" />
              </div>
              <div>
                <label className="text-xs font-body text-muted-foreground mb-1 block">Рядов: {newBed.rows}</label>
                <input type="range" min={1} max={5} value={newBed.rows} onChange={e => setNewBed(p => ({ ...p, rows: +e.target.value }))} className="w-full accent-moss" />
              </div>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs font-body text-muted-foreground mb-2">Предпросмотр ({newBed.cols}×{newBed.rows} = {newBed.cols * newBed.rows} ячеек)</p>
              <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${newBed.cols}, 28px)` }}>
                {Array(newBed.cols * newBed.rows).fill(null).map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded bg-moss/20 border border-moss/30" />
                ))}
              </div>
            </div>
            <button onClick={handleAddBed} disabled={!newBed.name.trim()} className="w-full py-3 bg-moss text-white rounded-xl font-body font-medium text-sm disabled:opacity-40 hover:opacity-90 transition-opacity">
              Добавить на план
            </button>
          </div>
        </div>
      )}

      {/* ── Add plot ──────────────────────────────────────────────────────── */}
      {showAddPlot && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4" onClick={() => setShowAddPlot(false)}>
          <div className="bg-card w-full max-w-md rounded-3xl p-5 shadow-2xl animate-scale-in space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">Новый участок</h3>
              <button onClick={() => setShowAddPlot(false)}><Icon name="X" size={20} className="text-muted-foreground" /></button>
            </div>
            <input
              value={newPlotName}
              onChange={e => setNewPlotName(e.target.value)}
              placeholder="Например: Дача у реки"
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30"
            />
            <button onClick={handleAddPlot} disabled={!newPlotName.trim()} className="w-full py-3 bg-moss text-white rounded-xl font-body font-medium text-sm disabled:opacity-40 hover:opacity-90 transition-opacity">
              Создать участок
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────

type PlantSlot = {
  emoji: string;
  name: string;
  color: string;
};

type BedItem = {
  id: string;
  x: number; // % of canvas width
  y: number; // % of canvas height
  w: number; // % of canvas width
  h: number; // % of canvas height
  name: string;
  color: string;
  cells: (PlantSlot | null)[];
  cols: number;
  rows: number;
};

type Plot = {
  id: string;
  name: string;
  beds: BedItem[];
};

// ─── Constants ───────────────────────────────────────────────────────────────

const PALETTE: PlantSlot[] = [
  { emoji: "🍅", name: "Томаты",   color: "#c0392b" },
  { emoji: "🥕", name: "Морковь",  color: "#e67e22" },
  { emoji: "🥬", name: "Салат",    color: "#27ae60" },
  { emoji: "🥒", name: "Огурцы",   color: "#2ecc71" },
  { emoji: "🧅", name: "Лук",      color: "#9b59b6" },
  { emoji: "🌽", name: "Кукуруза", color: "#f1c40f" },
  { emoji: "🫑", name: "Перец",    color: "#e74c3c" },
  { emoji: "🥦", name: "Брокколи", color: "#1a7a4a" },
  { emoji: "🌿", name: "Зелень",   color: "#45b39d" },
  { emoji: "🫛", name: "Горох",    color: "#58d68d" },
  { emoji: "🧄", name: "Чеснок",   color: "#8e6f3e" },
  { emoji: "🥔", name: "Картофель",color: "#a0522d" },
];

const BED_COLORS = [
  "#8B6914","#5a7a3a","#7a4a2a","#3a6b5a","#6b3a5a","#4a5a7a"
];

function makeId() { return Math.random().toString(36).slice(2, 9); }

function makeBed(x: number, y: number, name: string): BedItem {
  return {
    id: makeId(), x, y, w: 22, h: 16, name,
    color: BED_COLORS[Math.floor(Math.random() * BED_COLORS.length)],
    cols: 3, rows: 2,
    cells: Array(6).fill(null),
  };
}

const INITIAL_PLOTS: Plot[] = [
  {
    id: "plot1",
    name: "Мой огород",
    beds: [
      { ...makeBed(5, 10, "Грядка А"), id: "b1", cols: 3, rows: 2, cells: [
        { emoji: "🍅", name: "Томаты", color: "#c0392b" },
        { emoji: "🍅", name: "Томаты", color: "#c0392b" },
        { emoji: "🥒", name: "Огурцы", color: "#2ecc71" },
        null, null, null
      ]},
      { ...makeBed(32, 10, "Грядка Б"), id: "b2", cols: 2, rows: 3, cells: [
        { emoji: "🥕", name: "Морковь", color: "#e67e22" },
        { emoji: "🥬", name: "Салат", color: "#27ae60" },
        null, null, null, null
      ]},
      { ...makeBed(5, 40, "Грядка В"), id: "b3", cols: 4, rows: 1, cells: [
        { emoji: "🌿", name: "Зелень", color: "#45b39d" },
        { emoji: "🌿", name: "Зелень", color: "#45b39d" },
        null, null
      ], w: 28, h: 10 },
      { ...makeBed(40, 40, "Грядка Г"), id: "b4", cols: 2, rows: 2, cells: [null, null, null, null]},
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function GardenPlanEditor() {
  const [plots, setPlots] = useState<Plot[]>(INITIAL_PLOTS);
  const [activePlotId, setActivePlotId] = useState(INITIAL_PLOTS[0].id);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedCellIdx, setSelectedCellIdx] = useState<number | null>(null);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  const [showAddBed, setShowAddBed] = useState(false);
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [newPlotName, setNewPlotName] = useState("");
  const [newBed, setNewBed] = useState({ name: "", cols: 3, rows: 2 });
  const [editBedId, setEditBedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");

  // drag state
  const dragging = useRef<{ bedId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const activePlot = plots.find(p => p.id === activePlotId)!;

  const updateBeds = useCallback((updater: (beds: BedItem[]) => BedItem[]) => {
    setPlots(prev => prev.map(p => p.id === activePlotId ? { ...p, beds: updater(p.beds) } : p));
  }, [activePlotId]);

  // ── Drag (mouse + touch) ───────────────────────────────────────────────────

  const getCanvasPos = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { px: 0, py: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      px: ((clientX - rect.left) / rect.width) * 100,
      py: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const onPointerDown = (e: React.PointerEvent, bedId: string) => {
    if (mode !== "edit") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { px, py } = getCanvasPos(e.clientX, e.clientY);
    const bed = activePlot.beds.find(b => b.id === bedId)!;
    dragging.current = { bedId, startX: px, startY: py, origX: bed.x, origY: bed.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || mode !== "edit") return;
    const { px, py } = getCanvasPos(e.clientX, e.clientY);
    const dx = px - dragging.current.startX;
    const dy = py - dragging.current.startY;
    const newX = Math.max(0, Math.min(78, dragging.current.origX + dx));
    const newY = Math.max(0, Math.min(82, dragging.current.origY + dy));
    updateBeds(beds => beds.map(b => b.id === dragging.current!.bedId ? { ...b, x: newX, y: newY } : b));
  };

  const onPointerUp = () => { dragging.current = null; };

  // ── Resize ────────────────────────────────────────────────────────────────

  const resizing = useRef<{ bedId: string; startX: number; startY: number; origW: number; origH: number } | null>(null);

  const onResizeDown = (e: React.PointerEvent, bedId: string) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const { px, py } = getCanvasPos(e.clientX, e.clientY);
    const bed = activePlot.beds.find(b => b.id === bedId)!;
    resizing.current = { bedId, startX: px, startY: py, origW: bed.w, origH: bed.h };
  };

  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizing.current) return;
    const { px, py } = getCanvasPos(e.clientX, e.clientY);
    const dx = px - resizing.current.startX;
    const dy = py - resizing.current.startY;
    const newW = Math.max(12, Math.min(60, resizing.current.origW + dx));
    const newH = Math.max(8, Math.min(50, resizing.current.origH + dy));
    updateBeds(beds => beds.map(b => b.id === resizing.current!.bedId ? { ...b, w: newW, h: newH } : b));
  };

  const onResizeUp = () => { resizing.current = null; };

  // ── Plant picker ──────────────────────────────────────────────────────────

  const openCellPicker = (bedId: string, cellIdx: number) => {
    if (mode === "edit") return;
    setSelectedBedId(bedId);
    setSelectedCellIdx(cellIdx);
    setShowPlantPicker(true);
  };

  const assignPlant = (plant: PlantSlot | null) => {
    if (selectedBedId === null || selectedCellIdx === null) return;
    updateBeds(beds => beds.map(b => {
      if (b.id !== selectedBedId) return b;
      const cells = [...b.cells];
      cells[selectedCellIdx] = plant;
      return { ...b, cells };
    }));
    setShowPlantPicker(false);
  };

  // ── Add bed ───────────────────────────────────────────────────────────────

  const addBed = () => {
    if (!newBed.name.trim()) return;
    const cellCount = newBed.cols * newBed.rows;
    const bed: BedItem = {
      id: makeId(), x: 10, y: 10, w: newBed.cols * 7 + 2, h: newBed.rows * 8 + 2,
      name: newBed.name, color: BED_COLORS[Math.floor(Math.random() * BED_COLORS.length)],
      cols: newBed.cols, rows: newBed.rows,
      cells: Array(cellCount).fill(null),
    };
    updateBeds(beds => [...beds, bed]);
    setNewBed({ name: "", cols: 3, rows: 2 });
    setShowAddBed(false);
  };

  const deleteBed = (bedId: string) => {
    updateBeds(beds => beds.filter(b => b.id !== bedId));
    setEditBedId(null);
  };

  // ── Add plot ──────────────────────────────────────────────────────────────

  const addPlot = () => {
    if (!newPlotName.trim()) return;
    const plot: Plot = { id: makeId(), name: newPlotName, beds: [] };
    setPlots(prev => [...prev, plot]);
    setActivePlotId(plot.id);
    setNewPlotName("");
    setShowAddPlot(false);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const allCells = activePlot.beds.flatMap(b => b.cells);
  const planted = allCells.filter(Boolean).length;
  const total = allCells.length;
  const cultures = new Set(allCells.filter(Boolean).map(c => c!.name)).size;

  return (
    <div className="space-y-3 pb-2">

      {/* Plot tabs */}
      <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
        {plots.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePlotId(p.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-body font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activePlotId === p.id ? "bg-moss text-white shadow-sm" : "bg-card border border-border text-muted-foreground"
            }`}
          >
            {p.name}
          </button>
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
        <div className="flex-1 bg-card border border-border rounded-2xl p-3">
          <p className="text-[10px] text-muted-foreground font-body">Засажено</p>
          <p className="text-xl font-display font-semibold text-moss">{planted}<span className="text-xs text-muted-foreground">/{total}</span></p>
        </div>
        <div className="flex-1 bg-card border border-border rounded-2xl p-3">
          <p className="text-[10px] text-muted-foreground font-body">Грядок</p>
          <p className="text-xl font-display font-semibold text-earth">{activePlot.beds.length}</p>
        </div>
        <div className="flex-1 bg-card border border-border rounded-2xl p-3">
          <p className="text-[10px] text-muted-foreground font-body">Культур</p>
          <p className="text-xl font-display font-semibold" style={{ color: "hsl(var(--accent))" }}>{cultures}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-body">
          {mode === "edit" ? "✏️ Режим редактирования — перетаскивайте грядки" : "👆 Нажмите на ячейку для посадки"}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setMode(m => m === "edit" ? "view" : "edit")}
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
          background: "repeating-linear-gradient(0deg, transparent, transparent 39px, hsl(var(--border)/0.4) 39px, hsl(var(--border)/0.4) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, hsl(var(--border)/0.4) 39px, hsl(var(--border)/0.4) 40px), hsl(var(--muted))",
        }}
        onPointerMove={e => { onPointerMove(e); onResizeMove(e); }}
        onPointerUp={() => { onPointerUp(); onResizeUp(); }}
        onPointerLeave={() => { onPointerUp(); onResizeUp(); }}
      >
        {/* Empty state */}
        {activePlot.beds.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <span className="text-4xl">🌱</span>
            <p className="text-sm font-body">Добавьте первую грядку</p>
          </div>
        )}

        {activePlot.beds.map(bed => (
          <div
            key={bed.id}
            className="absolute group"
            style={{ left: `${bed.x}%`, top: `${bed.y}%`, width: `${bed.w}%`, height: `${bed.h}%` }}
            onPointerDown={e => onPointerDown(e, bed.id)}
          >
            {/* Bed body */}
            <div
              className={`w-full h-full rounded-xl border-2 flex flex-col overflow-hidden transition-shadow ${
                mode === "edit" ? "cursor-grab active:cursor-grabbing shadow-lg" : "cursor-default"
              } ${editBedId === bed.id ? "ring-2 ring-white" : ""}`}
              style={{ borderColor: bed.color, backgroundColor: bed.color + "18" }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-1.5 py-0.5 flex-shrink-0"
                style={{ backgroundColor: bed.color + "44" }}
              >
                <span className="text-[9px] font-body font-semibold text-foreground/80 truncate leading-tight">{bed.name}</span>
                {mode === "edit" && (
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setEditBedId(editBedId === bed.id ? null : bed.id); }}
                    className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0"
                  >
                    <Icon name="MoreVertical" size={9} className="text-foreground/70" />
                  </button>
                )}
              </div>

              {/* Cells grid */}
              <div
                className="flex-1 grid gap-0.5 p-0.5"
                style={{ gridTemplateColumns: `repeat(${bed.cols}, 1fr)` }}
              >
                {bed.cells.map((cell, idx) => (
                  <button
                    key={idx}
                    onPointerDown={e => e.stopPropagation()}
                    onClick={() => openCellPicker(bed.id, idx)}
                    className={`rounded flex items-center justify-center transition-all text-center ${
                      mode === "edit" ? "cursor-default pointer-events-none" :
                      cell ? "hover:brightness-95" : "hover:bg-white/40 border border-dashed border-white/30"
                    }`}
                    style={cell ? { backgroundColor: cell.color + "33" } : { backgroundColor: "transparent" }}
                    title={cell?.name}
                  >
                    {cell ? (
                      <span style={{ fontSize: "clamp(8px, 1.8vw, 16px)" }}>{cell.emoji}</span>
                    ) : (
                      <span style={{ fontSize: "clamp(6px, 1vw, 10px)" }} className="text-white/30">+</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Resize handle */}
            {mode === "edit" && (
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10"
                style={{
                  background: `linear-gradient(135deg, transparent 50%, ${bed.color} 50%)`,
                  borderRadius: "0 0 10px 0",
                }}
                onPointerDown={e => { e.stopPropagation(); onResizeDown(e, bed.id); }}
              />
            )}

            {/* Bed context menu */}
            {editBedId === bed.id && mode === "edit" && (
              <div
                className="absolute top-7 right-0 z-20 bg-card border border-border rounded-xl shadow-xl p-1 min-w-[120px]"
                onPointerDown={e => e.stopPropagation()}
              >
                <button
                  onClick={() => { setEditBedId(null); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-body rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Icon name="Check" size={12} />
                  Готово
                </button>
                <button
                  onClick={() => deleteBed(bed.id)}
                  className="w-full text-left px-3 py-1.5 text-xs font-body rounded-lg hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
                >
                  <Icon name="Trash2" size={12} />
                  Удалить
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Legend bottom-right */}
        {activePlot.beds.length > 0 && (
          <div className="absolute bottom-2 right-2 flex flex-col gap-0.5 pointer-events-none">
            {[...new Set(activePlot.beds.flatMap(b => b.cells).filter(Boolean).map(c => c!.name))].slice(0, 5).map(name => {
              const plant = PALETTE.find(p => p.name === name);
              if (!plant) return null;
              return (
                <div key={name} className="flex items-center gap-1 bg-card/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                  <span style={{ fontSize: 10 }}>{plant.emoji}</span>
                  <span className="text-[9px] font-body text-foreground/70">{name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Plant picker modal ──────────────────────────────────────────────── */}
      {showPlantPicker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4" onClick={() => setShowPlantPicker(false)}>
          <div className="bg-card w-full max-w-md rounded-3xl p-5 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold">Выберите растение</h3>
              <button onClick={() => setShowPlantPicker(false)}><Icon name="X" size={20} className="text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PALETTE.map(plant => (
                <button
                  key={plant.name}
                  onClick={() => assignPlant(plant)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <span className="text-2xl">{plant.emoji}</span>
                  <span className="text-[9px] font-body text-muted-foreground text-center leading-tight">{plant.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => assignPlant(null)}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm font-body hover:border-destructive/50 hover:text-destructive transition-colors"
            >
              Очистить ячейку
            </button>
          </div>
        </div>
      )}

      {/* ── Add bed modal ───────────────────────────────────────────────────── */}
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
            {/* Preview */}
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs font-body text-muted-foreground mb-2">Предпросмотр ({newBed.cols}×{newBed.rows} = {newBed.cols * newBed.rows} ячеек)</p>
              <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${newBed.cols}, 28px)` }}>
                {Array(newBed.cols * newBed.rows).fill(null).map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded bg-moss/20 border border-moss/30" />
                ))}
              </div>
            </div>
            <button
              onClick={addBed}
              disabled={!newBed.name.trim()}
              className="w-full py-3 bg-moss text-white rounded-xl font-body font-medium text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Добавить на план
            </button>
          </div>
        </div>
      )}

      {/* ── Add plot modal ──────────────────────────────────────────────────── */}
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
            <button
              onClick={addPlot}
              disabled={!newPlotName.trim()}
              className="w-full py-3 bg-moss text-white rounded-xl font-body font-medium text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Создать участок
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import Icon from "@/components/ui/icon";
import GardenPlanEditor from "@/components/GardenPlanEditor";

type Plant = {
  emoji: string;
  name: string;
  color: string;
};

type Cell = {
  id: string;
  plant: Plant | null;
};

const PLANTS: Plant[] = [
  { emoji: "🍅", name: "Томаты",   color: "#c0392b" },
  { emoji: "🥕", name: "Морковь",  color: "#e67e22" },
  { emoji: "🥬", name: "Салат",    color: "#27ae60" },
  { emoji: "🌽", name: "Кукуруза", color: "#f1c40f" },
  { emoji: "🥒", name: "Огурцы",   color: "#2ecc71" },
  { emoji: "🧅", name: "Лук",      color: "#9b59b6" },
  { emoji: "🫑", name: "Перец",    color: "#e74c3c" },
  { emoji: "🥦", name: "Брокколи", color: "#1a7a4a" },
  { emoji: "🫛", name: "Горох",    color: "#58d68d" },
  { emoji: "🌿", name: "Зелень",   color: "#45b39d" },
];

const BEDS = [
  { id: "bed1", name: "Грядка А", cells: ["A1","A2","A3","A4","A5","A6"] },
  { id: "bed2", name: "Грядка Б", cells: ["B1","B2","B3","B4","B5","B6"] },
  { id: "bed3", name: "Грядка В", cells: ["C1","C2","C3","C4"] },
  { id: "bed4", name: "Грядка Г", cells: ["D1","D2","D3","D4"] },
];

const initialCells: Record<string, Cell> = {
  "A1": { id: "A1", plant: PLANTS[0] },
  "A2": { id: "A2", plant: PLANTS[0] },
  "A3": { id: "A3", plant: PLANTS[4] },
  "A4": { id: "A4", plant: PLANTS[4] },
  "B1": { id: "B1", plant: PLANTS[1] },
  "B2": { id: "B2", plant: PLANTS[1] },
  "B3": { id: "B3", plant: PLANTS[9] },
  "C1": { id: "C1", plant: PLANTS[6] },
  "D2": { id: "D2", plant: PLANTS[2] },
};

BEDS.forEach(bed => {
  bed.cells.forEach(cellId => {
    if (!initialCells[cellId]) {
      initialCells[cellId] = { id: cellId, plant: null };
    }
  });
});

type ViewMode = "plan" | "list";

export default function GardenMap() {
  const [viewMode, setViewMode] = useState<ViewMode>("plan");
  const [cells, setCells] = useState<Record<string, Cell>>(initialCells);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [showPlantPicker, setShowPlantPicker] = useState(false);

  const handleCellClick = (cellId: string) => {
    setSelectedCell(cellId);
    setShowPlantPicker(true);
  };

  const assignPlant = (plant: Plant | null) => {
    if (!selectedCell) return;
    setCells(prev => ({ ...prev, [selectedCell]: { ...prev[selectedCell], plant } }));
    setShowPlantPicker(false);
    setSelectedCell(null);
  };

  const plantedCount = Object.values(cells).filter(c => c.plant).length;
  const totalCount = Object.values(cells).length;

  return (
    <div className="space-y-4 pb-2">

      {/* View toggle */}
      <div className="flex mt-2 bg-muted/50 rounded-xl p-1 gap-1">
        <button
          onClick={() => setViewMode("plan")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-body font-medium transition-all ${
            viewMode === "plan" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Icon name="Map" size={14} />
          Схема участка
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-body font-medium transition-all ${
            viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Icon name="LayoutGrid" size={14} />
          Список грядок
        </button>
      </div>

      {/* Plan editor */}
      {viewMode === "plan" && <GardenPlanEditor />}

      {/* List view */}
      {viewMode === "list" && (
        <>
          {/* Stats bar */}
          <div className="flex gap-3">
            <div className="flex-1 bg-card border border-border rounded-2xl p-3">
              <p className="text-xs text-muted-foreground font-body">Засажено</p>
              <p className="text-2xl font-display font-semibold text-moss">{plantedCount}<span className="text-sm text-muted-foreground">/{totalCount}</span></p>
            </div>
            <div className="flex-1 bg-card border border-border rounded-2xl p-3">
              <p className="text-xs text-muted-foreground font-body">Грядок</p>
              <p className="text-2xl font-display font-semibold text-earth">{BEDS.length}</p>
            </div>
            <div className="flex-1 bg-card border border-border rounded-2xl p-3">
              <p className="text-xs text-muted-foreground font-body">Культур</p>
              <p className="text-2xl font-display font-semibold" style={{ color: "hsl(var(--accent))" }}>
                {new Set(Object.values(cells).filter(c => c.plant).map(c => c.plant!.name)).size}
              </p>
            </div>
          </div>

          {BEDS.map(bed => (
            <div key={bed.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-semibold text-foreground">{bed.name}</h3>
                <span className="text-xs text-muted-foreground font-body">
                  {bed.cells.filter(id => cells[id]?.plant).length}/{bed.cells.length}
                </span>
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${bed.cells.length <= 4 ? 4 : 6}, 1fr)` }}>
                {bed.cells.map(cellId => {
                  const cell = cells[cellId];
                  return (
                    <button
                      key={cellId}
                      onClick={() => handleCellClick(cellId)}
                      className={`bed-cell aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 text-center
                        ${cell?.plant
                          ? "border-transparent shadow-sm"
                          : "border-dashed border-border bg-muted/40 hover:border-moss/50"
                        }`}
                      style={cell?.plant ? { backgroundColor: cell.plant.color + "22", borderColor: cell.plant.color + "66" } : {}}
                    >
                      {cell?.plant ? (
                        <>
                          <span className="text-xl leading-none">{cell.plant.emoji}</span>
                          <span className="text-[9px] font-body text-foreground/70 leading-tight px-0.5">{cell.plant.name}</span>
                        </>
                      ) : (
                        <Icon name="Plus" size={14} className="text-muted-foreground/50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Plant picker modal */}
          {showPlantPicker && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4" onClick={() => setShowPlantPicker(false)}>
              <div className="bg-card w-full max-w-md rounded-3xl p-5 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-semibold">Выберите растение</h3>
                  <button onClick={() => setShowPlantPicker(false)}>
                    <Icon name="X" size={20} className="text-muted-foreground" />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {PLANTS.map(plant => (
                    <button
                      key={plant.name}
                      onClick={() => assignPlant(plant)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors"
                    >
                      <span className="text-2xl">{plant.emoji}</span>
                      <span className="text-[10px] font-body text-muted-foreground leading-tight text-center">{plant.name}</span>
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
        </>
      )}
    </div>
  );
}

import { useState } from "react";
import Icon from "@/components/ui/icon";

type Entry = {
  id: number;
  date: string;
  plant: string;
  emoji: string;
  bed: string;
  weight: number;
  unit: string;
  note: string;
  season: number;
};

const initialEntries: Entry[] = [
  { id: 1, date: "15 авг 2025", plant: "Томаты", emoji: "🍅", bed: "Грядка А", weight: 4.2, unit: "кг", note: "Отличный урожай, крупные плоды", season: 2025 },
  { id: 2, date: "10 авг 2025", plant: "Огурцы", emoji: "🥒", bed: "Грядка А", weight: 3.8, unit: "кг", note: "Снимал каждые 2 дня", season: 2025 },
  { id: 3, date: "5 авг 2025", plant: "Кабачки", emoji: "🥦", bed: "Грядка В", weight: 5.5, unit: "кг", note: "", season: 2025 },
  { id: 4, date: "20 июл 2025", plant: "Морковь", emoji: "🥕", bed: "Грядка Б", weight: 2.1, unit: "кг", note: "Чуть мелковата, добавить удобрений", season: 2025 },
  { id: 5, date: "18 июл 2025", plant: "Перец", emoji: "🫑", bed: "Грядка В", weight: 1.6, unit: "кг", note: "Острый, уродился хорошо", season: 2025 },
  { id: 6, date: "12 июл 2025", plant: "Лук", emoji: "🧅", bed: "Грядка Б", weight: 3.0, unit: "кг", note: "Засушу половину", season: 2025 },
  { id: 7, date: "20 авг 2024", plant: "Томаты", emoji: "🍅", bed: "Грядка А", weight: 3.5, unit: "кг", note: "Немного болели фитофторой", season: 2024 },
  { id: 8, date: "15 авг 2024", plant: "Огурцы", emoji: "🥒", bed: "Грядка Б", weight: 4.1, unit: "кг", note: "Хороший урожай", season: 2024 },
];

const SEASONS = [2025, 2024];

export default function HarvestJournal() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [selectedSeason, setSelectedSeason] = useState(2025);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ plant: "", emoji: "🌱", bed: "", weight: "", note: "" });

  const filtered = entries.filter(e => e.season === selectedSeason);

  const totalWeight = filtered.reduce((sum, e) => sum + e.weight, 0);
  const topPlant = filtered.reduce((acc, e) => {
    acc[e.plant] = (acc[e.plant] || 0) + e.weight;
    return acc;
  }, {} as Record<string, number>);
  const champion = Object.entries(topPlant).sort((a, b) => b[1] - a[1])[0];

  const addEntry = () => {
    if (!newEntry.plant || !newEntry.weight) return;
    const e: Entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }),
      plant: newEntry.plant,
      emoji: newEntry.emoji,
      bed: newEntry.bed || "—",
      weight: parseFloat(newEntry.weight),
      unit: "кг",
      note: newEntry.note,
      season: 2025,
    };
    setEntries(prev => [e, ...prev]);
    setNewEntry({ plant: "", emoji: "🌱", bed: "", weight: "", note: "" });
    setShowAdd(false);
    setSelectedSeason(2025);
  };

  return (
    <div className="space-y-4 pb-2">
      {/* Season selector */}
      <div className="flex items-center gap-2 mt-2">
        <div className="flex gap-1.5 flex-1">
          {SEASONS.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSeason(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-body font-medium transition-all ${
                selectedSeason === s ? "bg-earth text-white" : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-moss rounded-full text-white text-xs font-body font-medium shadow-sm"
        >
          <Icon name="Plus" size={14} />
          Запись
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚖️</span>
            <p className="text-xs font-body text-muted-foreground">Общий урожай</p>
          </div>
          <p className="font-display text-3xl font-semibold text-foreground">{totalWeight.toFixed(1)}<span className="text-base text-muted-foreground ml-1">кг</span></p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🏆</span>
            <p className="text-xs font-body text-muted-foreground">Лучшая культура</p>
          </div>
          {champion ? (
            <>
              <p className="font-display text-xl font-semibold text-foreground">{champion[0]}</p>
              <p className="text-xs font-body text-muted-foreground">{champion[1].toFixed(1)} кг</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground font-body">Нет данных</p>
          )}
        </div>
      </div>

      {/* Chart bars */}
      {Object.keys(topPlant).length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-sm font-semibold text-foreground mb-3">Урожай по культурам</p>
          <div className="space-y-2.5">
            {Object.entries(topPlant).sort((a, b) => b[1] - a[1]).map(([plant, kg]) => {
              const entry = filtered.find(e => e.plant === plant);
              const pct = (kg / totalWeight) * 100;
              return (
                <div key={plant} className="flex items-center gap-2">
                  <span className="text-lg w-7 flex-shrink-0">{entry?.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-body text-foreground">{plant}</span>
                      <span className="text-xs font-body text-muted-foreground">{kg.toFixed(1)} кг</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: "hsl(var(--moss))" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="space-y-2">
        <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide px-1">История сборов</p>
        {filtered.length === 0 && (
          <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
            <span className="text-3xl block mb-2">📋</span>
            <p className="text-sm font-body text-muted-foreground">Нет записей за {selectedSeason} год</p>
          </div>
        )}
        {filtered.map(entry => (
          <div key={entry.id} className="bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-straw/30 flex items-center justify-center text-xl flex-shrink-0">
              {entry.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-body font-semibold text-sm text-foreground">{entry.plant}</p>
                <p className="font-display font-semibold text-base text-moss">{entry.weight} {entry.unit}</p>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-body text-muted-foreground">{entry.bed}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-[11px] font-body text-muted-foreground">{entry.date}</span>
              </div>
              {entry.note && (
                <p className="text-[11px] font-body text-muted-foreground mt-0.5 italic">"{entry.note}"</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-card w-full max-w-md rounded-3xl p-5 shadow-2xl animate-scale-in space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">Записать урожай</h3>
              <button onClick={() => setShowAdd(false)}><Icon name="X" size={20} className="text-muted-foreground" /></button>
            </div>
            <input
              placeholder="Культура (например, Томаты)"
              value={newEntry.plant}
              onChange={e => setNewEntry(p => ({ ...p, plant: e.target.value }))}
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30"
            />
            <div className="flex gap-2">
              <input
                placeholder="Вес (кг)"
                type="number"
                value={newEntry.weight}
                onChange={e => setNewEntry(p => ({ ...p, weight: e.target.value }))}
                className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30"
              />
              <input
                placeholder="Грядка"
                value={newEntry.bed}
                onChange={e => setNewEntry(p => ({ ...p, bed: e.target.value }))}
                className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30"
              />
            </div>
            <textarea
              placeholder="Заметки (необязательно)"
              value={newEntry.note}
              onChange={e => setNewEntry(p => ({ ...p, note: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30 resize-none"
            />
            <button
              onClick={addEntry}
              className="w-full py-3 bg-moss text-white rounded-xl font-body font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

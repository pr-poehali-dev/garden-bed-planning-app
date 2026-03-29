import { useState } from "react";
import Icon from "@/components/ui/icon";

type Reminder = {
  id: number;
  type: "water" | "feed" | "care";
  plant: string;
  emoji: string;
  task: string;
  date: string;
  done: boolean;
  bed: string;
};

const typeConfig = {
  water: { icon: "Droplets", color: "#3498db", bg: "#3498db22", label: "Полив" },
  feed: { icon: "Leaf", color: "#27ae60", bg: "#27ae6022", label: "Подкормка" },
  care: { icon: "Scissors", color: "#e67e22", bg: "#e67e2222", label: "Уход" },
};

const initialReminders: Reminder[] = [
  { id: 1, type: "water", plant: "Томаты", emoji: "🍅", task: "Полив под корень", date: "Сегодня", done: false, bed: "Грядка А" },
  { id: 2, type: "feed", plant: "Огурцы", emoji: "🥒", task: "Подкормка азотом", date: "Сегодня", done: false, bed: "Грядка А" },
  { id: 3, type: "care", plant: "Томаты", emoji: "🍅", task: "Удалить пасынки", date: "Завтра", done: false, bed: "Грядка А" },
  { id: 4, type: "water", plant: "Перец", emoji: "🫑", task: "Умеренный полив", date: "Завтра", done: false, bed: "Грядка В" },
  { id: 5, type: "feed", plant: "Морковь", emoji: "🥕", task: "Рыхление почвы", date: "29 марта", done: false, bed: "Грядка Б" },
  { id: 6, type: "care", plant: "Базилик", emoji: "🌿", task: "Прищипнуть цветоносы", date: "30 марта", done: true, bed: "Грядка Г" },
  { id: 7, type: "water", plant: "Салат", emoji: "🥬", task: "Ежедневный полив", date: "Сегодня", done: true, bed: "Грядка Б" },
];

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [filter, setFilter] = useState<"all" | "water" | "feed" | "care">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ plant: "", task: "", type: "water" as "water" | "feed" | "care", date: "" });

  const toggle = (id: number) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  };

  const addReminder = () => {
    if (!newTask.plant || !newTask.task) return;
    const r: Reminder = {
      id: Date.now(),
      type: newTask.type,
      plant: newTask.plant,
      emoji: "🌱",
      task: newTask.task,
      date: newTask.date || "Сегодня",
      done: false,
      bed: "—",
    };
    setReminders(prev => [r, ...prev]);
    setNewTask({ plant: "", task: "", type: "water", date: "" });
    setShowAdd(false);
  };

  const filtered = reminders.filter(r => filter === "all" || r.type === filter);
  const pending = reminders.filter(r => !r.done).length;

  const groups = ["Сегодня", "Завтра"].concat(
    [...new Set(filtered.map(r => r.date))].filter(d => d !== "Сегодня" && d !== "Завтра")
  );

  return (
    <div className="space-y-4 pb-2">
      {/* Summary card */}
      <div className="mt-2 bg-moss rounded-2xl p-4 text-white relative overflow-hidden">
        <div className="absolute right-3 top-3 text-4xl opacity-20">🌤️</div>
        <p className="font-body text-white/70 text-sm">Активных задач</p>
        <p className="font-display text-4xl font-semibold mt-1">{pending}</p>
        <p className="font-body text-white/70 text-xs mt-1">из {reminders.length} запланированных</p>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5 flex-1 overflow-x-auto pb-0.5">
          {(["all", "water", "feed", "care"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-body font-medium whitespace-nowrap transition-all ${
                filter === f ? "bg-moss text-white" : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {f === "all" ? "Все" : typeConfig[f].label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-8 h-8 rounded-full bg-moss flex items-center justify-center text-white shadow-sm flex-shrink-0"
        >
          <Icon name="Plus" size={16} />
        </button>
      </div>

      {/* Reminders list grouped */}
      {groups.map(group => {
        const items = filtered.filter(r => r.date === group);
        if (!items.length) return null;
        return (
          <div key={group}>
            <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">{group}</p>
            <div className="space-y-2">
              {items.map(r => {
                const cfg = typeConfig[r.type];
                return (
                  <div
                    key={r.id}
                    className={`bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3 transition-all ${r.done ? "opacity-50" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: cfg.bg }}>
                      {r.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-body font-semibold text-foreground truncate">{r.plant}</span>
                        <span className="text-[10px] font-body px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs font-body text-muted-foreground mt-0.5">{r.task} · {r.bed}</p>
                    </div>
                    <button
                      onClick={() => toggle(r.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        r.done ? "bg-moss border-moss" : "border-border"
                      }`}
                    >
                      {r.done && <Icon name="Check" size={12} className="text-white" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-card w-full max-w-md rounded-3xl p-5 shadow-2xl animate-scale-in space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">Новое напоминание</h3>
              <button onClick={() => setShowAdd(false)}><Icon name="X" size={20} className="text-muted-foreground" /></button>
            </div>
            <input
              placeholder="Растение (например, Томаты)"
              value={newTask.plant}
              onChange={e => setNewTask(p => ({ ...p, plant: e.target.value }))}
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30"
            />
            <input
              placeholder="Задача (например, Полив под корень)"
              value={newTask.task}
              onChange={e => setNewTask(p => ({ ...p, task: e.target.value }))}
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30"
            />
            <div className="flex gap-2">
              {(["water", "feed", "care"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setNewTask(p => ({ ...p, type: t }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-body font-medium transition-all ${
                    newTask.type === t ? "bg-moss text-white" : "bg-muted/50 border border-border text-muted-foreground"
                  }`}
                >
                  {typeConfig[t].label}
                </button>
              ))}
            </div>
            <input
              placeholder="Дата (например, 1 апреля)"
              value={newTask.date}
              onChange={e => setNewTask(p => ({ ...p, date: e.target.value }))}
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30"
            />
            <button
              onClick={addReminder}
              className="w-full py-3 bg-moss text-white rounded-xl font-body font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Добавить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

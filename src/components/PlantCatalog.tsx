import { useState } from "react";
import Icon from "@/components/ui/icon";

type Plant = {
  emoji: string;
  name: string;
  category: string;
  season: string;
  watering: string;
  spacing: string;
  sunlight: string;
  maturity: string;
  tips: string;
  color: string;
};

const CATALOG: Plant[] = [
  {
    emoji: "🍅", name: "Томаты", category: "Овощи", season: "Апр – Авг",
    watering: "Каждые 2-3 дня", spacing: "50-70 см", sunlight: "Полное солнце",
    maturity: "60-80 дней", tips: "Подвязывайте к опорам, удаляйте пасынки", color: "#c0392b"
  },
  {
    emoji: "🥕", name: "Морковь", category: "Корнеплоды", season: "Мар – Июн",
    watering: "Раз в 3-4 дня", spacing: "5-10 см", sunlight: "Полное солнце",
    maturity: "70-80 дней", tips: "Рыхлите почву на глубину 30 см перед посевом", color: "#e67e22"
  },
  {
    emoji: "🥬", name: "Салат", category: "Зелень", season: "Мар – Май",
    watering: "Ежедневно", spacing: "20-30 см", sunlight: "Полутень",
    maturity: "30-45 дней", tips: "Срезайте внешние листья для непрерывного роста", color: "#27ae60"
  },
  {
    emoji: "🥒", name: "Огурцы", category: "Овощи", season: "Май – Авг",
    watering: "Каждые 2 дня", spacing: "30-60 см", sunlight: "Полное солнце",
    maturity: "50-60 дней", tips: "Опыляются насекомыми, высаживайте рядом с цветами", color: "#2ecc71"
  },
  {
    emoji: "🧅", name: "Лук", category: "Корнеплоды", season: "Апр – Июн",
    watering: "Раз в неделю", spacing: "10-15 см", sunlight: "Полное солнце",
    maturity: "90-120 дней", tips: "Прекращайте полив за 2 недели до уборки", color: "#9b59b6"
  },
  {
    emoji: "🌽", name: "Кукуруза", category: "Злаки", season: "Май – Июл",
    watering: "Каждые 3 дня", spacing: "30-40 см", sunlight: "Полное солнце",
    maturity: "80-100 дней", tips: "Сажайте блоками для лучшего опыления", color: "#f1c40f"
  },
  {
    emoji: "🫑", name: "Перец", category: "Овощи", season: "Май – Сен",
    watering: "Каждые 2-3 дня", spacing: "40-50 см", sunlight: "Полное солнце",
    maturity: "70-90 дней", tips: "Не переувлажняйте — любит тепло и солнце", color: "#e74c3c"
  },
  {
    emoji: "🥦", name: "Брокколи", category: "Овощи", season: "Мар – Май",
    watering: "Каждые 2 дня", spacing: "45-60 см", sunlight: "Полутень",
    maturity: "60-80 дней", tips: "Собирайте до цветения, пока головки плотные", color: "#1a7a4a"
  },
  {
    emoji: "🌿", name: "Базилик", category: "Зелень", season: "Май – Авг",
    watering: "Ежедневно", spacing: "20-30 см", sunlight: "Полное солнце",
    maturity: "25-30 дней", tips: "Прищипывайте цветоносы для пышного куста", color: "#45b39d"
  },
  {
    emoji: "🫛", name: "Горох", category: "Бобовые", season: "Апр – Июн",
    watering: "Раз в 2-3 дня", spacing: "5-10 см", sunlight: "Полное солнце",
    maturity: "55-70 дней", tips: "Нуждается в опорах, обогащает почву азотом", color: "#58d68d"
  },
];

const CATEGORIES = ["Все", "Овощи", "Корнеплоды", "Зелень", "Злаки", "Бобовые"];

export default function PlantCatalog() {
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [search, setSearch] = useState("");

  const filtered = CATALOG.filter(p =>
    (selectedCategory === "Все" || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-2">
      {/* Search */}
      <div className="relative mt-2">
        <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Найти растение..."
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30 transition-all"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-body font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-moss text-white shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Plant cards */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(plant => (
          <button
            key={plant.name}
            onClick={() => setSelectedPlant(plant)}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
              style={{ backgroundColor: plant.color + "22" }}
            >
              {plant.emoji}
            </div>
            <p className="font-display text-base font-semibold text-foreground">{plant.name}</p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">{plant.category}</p>
            <div className="mt-2 flex items-center gap-1">
              <Icon name="Calendar" size={11} className="text-muted-foreground" />
              <span className="text-[11px] font-body text-muted-foreground">{plant.season}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Plant detail modal */}
      {selectedPlant && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4" onClick={() => setSelectedPlant(null)}>
          <div
            className="bg-card w-full max-w-md rounded-3xl p-5 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ backgroundColor: selectedPlant.color + "22" }}>
                  {selectedPlant.emoji}
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold">{selectedPlant.name}</h3>
                  <p className="text-xs text-muted-foreground font-body">{selectedPlant.category}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPlant(null)}>
                <Icon name="X" size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { icon: "Droplets", label: "Полив", value: selectedPlant.watering },
                { icon: "Sun", label: "Освещение", value: selectedPlant.sunlight },
                { icon: "Ruler", label: "Расстояние", value: selectedPlant.spacing },
                { icon: "Clock", label: "Созревание", value: selectedPlant.maturity },
              ].map(item => (
                <div key={item.label} className="bg-muted/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon name={item.icon} size={13} className="text-moss" />
                    <span className="text-[11px] font-body text-muted-foreground">{item.label}</span>
                  </div>
                  <p className="text-sm font-body font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-straw/20 rounded-xl p-3 border border-straw/30">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">💡</span>
                <span className="text-xs font-body font-medium text-earth">Совет садовода</span>
              </div>
              <p className="text-sm font-body text-foreground/80">{selectedPlant.tips}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import GardenMap from "@/components/GardenMap";
import PlantCatalog from "@/components/PlantCatalog";
import Reminders from "@/components/Reminders";
import HarvestJournal from "@/components/HarvestJournal";
import Icon from "@/components/ui/icon";

type Tab = "map" | "catalog" | "reminders" | "journal";

const tabs = [
  { id: "map" as Tab, icon: "LayoutGrid", label: "Участок" },
  { id: "catalog" as Tab, icon: "Sprout", label: "Растения" },
  { id: "reminders" as Tab, icon: "Bell", label: "Уход" },
  { id: "journal" as Tab, icon: "BookOpen", label: "Журнал" },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("map");

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background relative overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-10 pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">
              {activeTab === "map" && "Мой участок"}
              {activeTab === "catalog" && "Каталог растений"}
              {activeTab === "reminders" && "Уход за садом"}
              {activeTab === "journal" && "Журнал урожая"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5 font-body">
              {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-moss flex items-center justify-center text-lg shadow-md">
            🌱
          </div>
        </div>
      </header>

      {/* Decorative organic blob */}
      <div
        className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(85,35%,32%) 0%, transparent 70%)",
          borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%",
          transform: "translate(20%, -20%)",
        }}
      />

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-28">
        <div className="animate-fade-in" key={activeTab}>
          {activeTab === "map" && <GardenMap />}
          {activeTab === "catalog" && <PlantCatalog />}
          {activeTab === "reminders" && <Reminders />}
          {activeTab === "journal" && <HarvestJournal />}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-6 pt-2 z-50">
        <div className="bg-card/90 backdrop-blur-md border border-border rounded-2xl shadow-xl px-2 py-2 flex justify-around">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-moss text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={tab.icon} size={20} />
              <span className="text-xs font-body font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

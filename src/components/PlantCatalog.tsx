import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { fetchPlants, createPlant, updatePlant, deletePlant, type Plant, type PlantInput } from "@/api/plants";

const CATEGORIES = ["Все", "Овощи", "Корнеплоды", "Зелень", "Злаки", "Бобовые"];
const COLORS = ["#c0392b","#e67e22","#27ae60","#2ecc71","#9b59b6","#f1c40f","#e74c3c","#1a7a4a","#45b39d","#58d68d","#3498db","#e91e63"];
const EMOJIS = ["🍅","🥕","🥬","🥒","🧅","🌽","🫑","🥦","🌿","🫛","🧄","🥔","🍆","🫐","🍓","🥑","🌶️","🫚","🌱","🪴"];

type ModalMode = "view" | "edit" | "add";

const emptyForm = (): PlantInput => ({
  emoji: "🌱", name: "", category: "Овощи", season: "", watering: "",
  spacing: "", sunlight: "Полное солнце", maturity: "", tips: "", color: "#27ae60"
});

export default function PlantCatalog() {
  const [catalog, setCatalog] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("view");
  const [formData, setFormData] = useState<PlantInput>(emptyForm());
  const [search, setSearch] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchPlants()
      .then(setCatalog)
      .finally(() => setLoading(false));
  }, []);

  const filtered = catalog.filter(p =>
    (selectedCategory === "Все" || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openView = (plant: Plant) => {
    setSelectedPlant(plant);
    setModalMode("view");
    setShowDeleteConfirm(false);
  };

  const openEdit = (plant: Plant) => {
    setSelectedPlant(plant);
    setFormData({ emoji: plant.emoji, name: plant.name, category: plant.category, season: plant.season, watering: plant.watering, spacing: plant.spacing, sunlight: plant.sunlight, maturity: plant.maturity, tips: plant.tips, color: plant.color });
    setModalMode("edit");
  };

  const openAdd = () => {
    setSelectedPlant(null);
    setFormData(emptyForm());
    setModalMode("add");
  };

  const closeModal = () => {
    setSelectedPlant(null);
    setModalMode("view");
    setShowDeleteConfirm(false);
  };

  const saveEdit = async () => {
    if (!formData.name || !selectedPlant) return;
    setSaving(true);
    await updatePlant(selectedPlant.id, formData);
    setCatalog(prev => prev.map(p => p.id === selectedPlant.id ? { ...formData, id: selectedPlant.id } : p));
    setSaving(false);
    closeModal();
  };

  const saveAdd = async () => {
    if (!formData.name) return;
    setSaving(true);
    const { id } = await createPlant(formData);
    setCatalog(prev => [...prev, { ...formData, id }]);
    setSaving(false);
    closeModal();
  };

  const handleDelete = async () => {
    if (!selectedPlant) return;
    setSaving(true);
    await deletePlant(selectedPlant.id);
    setCatalog(prev => prev.filter(p => p.id !== selectedPlant.id));
    setSaving(false);
    closeModal();
  };

  const field = (label: string, key: keyof PlantInput, placeholder?: string) => (
    <div>
      <label className="text-xs font-body text-muted-foreground mb-1 block">{label}</label>
      <input
        value={formData[key] as string}
        onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30"
      />
    </div>
  );

  const isFormMode = modalMode === "edit" || modalMode === "add";

  return (
    <div className="space-y-4 pb-2">
      {/* Search + Add */}
      <div className="flex gap-2 mt-2">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Найти растение..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30 transition-all"
          />
        </div>
        <button
          onClick={openAdd}
          className="w-11 h-11 bg-moss rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0 hover:opacity-90 transition-opacity"
        >
          <Icon name="Plus" size={20} />
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
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

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-muted mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Plant cards */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(plant => (
            <button
              key={plant.id}
              onClick={() => openView(plant)}
              className="bg-card border border-border rounded-2xl p-4 text-left hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: plant.color + "22" }}>
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

          {filtered.length === 0 && (
            <div className="col-span-2 bg-card border border-dashed border-border rounded-2xl p-8 text-center">
              <span className="text-3xl block mb-2">🌱</span>
              <p className="text-sm font-body text-muted-foreground">Ничего не найдено</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {(selectedPlant || isFormMode) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4" onClick={closeModal}>
          <div
            className="bg-card w-full max-w-md rounded-3xl shadow-2xl animate-slide-up overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 max-h-[85vh] overflow-y-auto">

              {/* VIEW mode */}
              {modalMode === "view" && selectedPlant && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: selectedPlant.color + "22" }}>
                        {selectedPlant.emoji}
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-semibold">{selectedPlant.name}</h3>
                        <p className="text-xs text-muted-foreground font-body">{selectedPlant.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(selectedPlant)} className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors">
                        <Icon name="Pencil" size={15} className="text-foreground" />
                      </button>
                      <button onClick={closeModal} className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors">
                        <Icon name="X" size={15} className="text-foreground" />
                      </button>
                    </div>
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
                        <p className="text-sm font-body font-medium text-foreground">{item.value || "—"}</p>
                      </div>
                    ))}
                  </div>

                  {selectedPlant.tips && (
                    <div className="bg-straw/20 rounded-xl p-3 border border-straw/30 mb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">💡</span>
                        <span className="text-xs font-body font-medium text-earth">Совет садовода</span>
                      </div>
                      <p className="text-sm font-body text-foreground/80">{selectedPlant.tips}</p>
                    </div>
                  )}

                  {showDeleteConfirm ? (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-body text-muted-foreground">
                        Отмена
                      </button>
                      <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-body font-medium disabled:opacity-60">
                        {saving ? "Удаляю..." : "Удалить"}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-2.5 rounded-xl border border-dashed border-destructive/40 text-destructive/70 text-sm font-body hover:bg-destructive/5 transition-colors mt-1">
                      Удалить из каталога
                    </button>
                  )}
                </>
              )}

              {/* EDIT / ADD mode */}
              {isFormMode && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-xl font-semibold">
                      {modalMode === "add" ? "Новое растение" : "Редактировать"}
                    </h3>
                    <button onClick={closeModal} className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center">
                      <Icon name="X" size={15} className="text-foreground" />
                    </button>
                  </div>

                  {/* Emoji picker */}
                  <div className="mb-3">
                    <label className="text-xs font-body text-muted-foreground mb-2 block">Иконка</label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJIS.map(em => (
                        <button
                          key={em}
                          onClick={() => setFormData(p => ({ ...p, emoji: em }))}
                          className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                            formData.emoji === em ? "bg-moss/20 ring-2 ring-moss" : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {field("Название *", "name", "Например: Баклажан")}

                    <div>
                      <label className="text-xs font-body text-muted-foreground mb-1 block">Категория</label>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.filter(c => c !== "Все").map(cat => (
                          <button
                            key={cat}
                            onClick={() => setFormData(p => ({ ...p, category: cat }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all ${
                              formData.category === cat ? "bg-moss text-white" : "bg-muted/50 border border-border text-muted-foreground"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {field("Сезон", "season", "Апр – Авг")}

                    <div className="grid grid-cols-2 gap-2">
                      {field("Полив", "watering", "Каждые 2 дня")}
                      {field("Расстояние", "spacing", "30-50 см")}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {field("Освещение", "sunlight", "Полное солнце")}
                      {field("Созревание", "maturity", "60-80 дней")}
                    </div>

                    <div>
                      <label className="text-xs font-body text-muted-foreground mb-1 block">Советы по уходу</label>
                      <textarea
                        value={formData.tips}
                        onChange={e => setFormData(p => ({ ...p, tips: e.target.value }))}
                        placeholder="Полезные советы..."
                        rows={2}
                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-moss/30 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-body text-muted-foreground mb-2 block">Цвет карточки</label>
                      <div className="flex gap-2 flex-wrap">
                        {COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setFormData(p => ({ ...p, color }))}
                            className={`w-8 h-8 rounded-full transition-all ${formData.color === color ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={modalMode === "edit" ? saveEdit : saveAdd}
                    disabled={!formData.name || saving}
                    className="w-full py-3 bg-moss text-white rounded-xl font-body font-medium text-sm mt-4 hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {saving ? "Сохраняю..." : modalMode === "edit" ? "Сохранить изменения" : "Добавить в каталог"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

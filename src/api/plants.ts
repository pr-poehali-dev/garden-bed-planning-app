import func2url from "../../backend/func2url.json";

const BASE = func2url.plants;

export type Plant = {
  id: number;
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

export type PlantInput = Omit<Plant, "id">;

export async function fetchPlants(): Promise<Plant[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error("Ошибка загрузки каталога");
  return res.json();
}

export async function createPlant(data: PlantInput): Promise<{ id: number }> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Ошибка создания растения");
  return res.json();
}

export async function updatePlant(id: number, data: PlantInput): Promise<void> {
  const res = await fetch(`${BASE}?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Ошибка обновления растения");
}

export async function deletePlant(id: number): Promise<void> {
  const res = await fetch(`${BASE}?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Ошибка удаления растения");
}

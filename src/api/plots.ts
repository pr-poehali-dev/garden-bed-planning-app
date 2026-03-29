import func2url from "../../backend/func2url.json";

const BASE = func2url.plots;

export type PlantSlot = { emoji: string; name: string; color: string } | null;

export type BedData = {
  id: string;
  plot_id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  rows: number;
  color: string;
  cells: PlantSlot[];
};

export type PlotData = {
  id: string;
  name: string;
  beds: BedData[];
};

export async function fetchPlots(): Promise<PlotData[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error("Ошибка загрузки участков");
  return res.json();
}

export async function addPlot(id: string, name: string): Promise<void> {
  await fetch(`${BASE}?action=add_plot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, name }),
  });
}

export async function addBed(bed: BedData): Promise<void> {
  await fetch(`${BASE}?action=add_bed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bed),
  });
}

export async function updateBed(bed: BedData): Promise<void> {
  await fetch(`${BASE}?action=update_bed`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bed),
  });
}

export async function deleteBedApi(id: string): Promise<void> {
  await fetch(`${BASE}?action=delete_bed&id=${id}`, { method: "DELETE" });
}

export async function deletePlotApi(id: string): Promise<void> {
  await fetch(`${BASE}?action=delete_plot&id=${id}`, { method: "DELETE" });
}

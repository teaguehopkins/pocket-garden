import type { WeatherDef } from '../types';

// v5 order kept for seed compatibility.
const list: WeatherDef[] = [
  { id: 'bloom', name: 'Bloom', text: 'Flowers +1 each', add: (g) => (g === 'flower' ? 1 : 0) },
  { id: 'wild', name: 'Wild', text: 'Animals +1 each', add: (g) => (g === 'animal' ? 1 : 0) },
  { id: 'rain', name: 'Rainy', text: 'Water +2 each', add: (g) => (g === 'water' ? 2 : 0) },
  { id: 'gloom', name: 'Overcast', text: 'Plants and fungi +1 each', add: (g) => (g === 'plant' || g === 'fungus' ? 1 : 0) },
  { id: 'grove', name: 'Old growth', text: 'Trees +2 each', add: (g) => (g === 'tree' ? 2 : 0) },
  { id: 'heat', name: 'Heatwave', text: 'Flowers +2, water −1', add: (g) => (g === 'flower' ? 2 : g === 'water' ? -1 : 0) },
];

export const WEATHER: Record<string, WeatherDef> = Object.fromEntries(list.map((w) => [w.id, w]));
export const weatherIds = () => list.map((w) => w.id);

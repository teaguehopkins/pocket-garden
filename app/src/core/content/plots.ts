import type { Board, CellFx } from '../board';
import type { Grid } from '../types';

export interface PlotDef {
  id: string;
  name: string;
  /** one line on what makes this plot different */
  twist: string;
  /**
   * Map rows. `.` soil, space = not part of the plot, `P` pond (pre-placed),
   * `O` old oak (pre-placed), `#` stone (blocked), `*` sunny patch (scores double),
   * `~` shade (squares in the shade of a wall), `S` stream (pre-placed), `C` centre soil.
   */
  map: string[];
  targets: [number, number, number];
}

export const PLOTS: PlotDef[] = [];

export function parsePlot(p: PlotDef): { board: Board; grid: Grid } {
  const h = p.map.length, w = Math.max(...p.map.map((r) => r.length));
  const mask: boolean[] = [], fx: CellFx[] = [], grid: Grid = [], centre: number[] = [];
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++) {
      const ch = p.map[r][c] ?? ' ';
      const i = r * w + c;
      mask.push(ch !== ' ');
      fx.push(ch === '*' ? 'sunny' : ch === '~' ? 'shade' : null);
      grid.push(ch === 'P' ? { s: 'pond', f: 1 } : ch === 'O' ? { s: 'oak', f: 1 } : ch === 'S' ? { s: 'stream', f: 1 } : ch === '#' ? { s: 'rock', f: 1 } : null);
      if (ch === 'C') centre.push(i);
    }
  return { board: { w, h, mask, fx, centre: centre.length ? centre : defaultCentre(w, h) }, grid };
}

function defaultCentre(w: number, h: number) {
  const rows = h % 2 ? [(h - 1) / 2] : [h / 2 - 1, h / 2];
  const cols = w % 2 ? [(w - 1) / 2] : [w / 2 - 1, w / 2];
  return rows.flatMap((r) => cols.map((c) => r * w + c));
}

export const plotById = (id: string) => PLOTS.find((p) => p.id === id);

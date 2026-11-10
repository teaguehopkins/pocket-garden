// Board geometry. A board is a w×h rectangle with a mask of squares that
// belong to the plot, so plots of any shape share the same neighbour logic.

export type CellFx = 'sunny' | 'shade' | null;

export interface Board {
  w: number;
  h: number;
  /** true where the square is part of the plot */
  mask: boolean[];
  /** per-square feature effect */
  fx: CellFx[];
  /** squares doubled by Centrepiece */
  centre: number[];
}

export function rectBoard(w: number, h: number, centre?: number[]): Board {
  return {
    w,
    h,
    mask: Array(w * h).fill(true),
    fx: Array(w * h).fill(null),
    centre: centre ?? defaultCentre(w, h),
  };
}

function defaultCentre(w: number, h: number): number[] {
  const rows = h % 2 ? [(h - 1) / 2] : [h / 2 - 1, h / 2];
  const cols = w % 2 ? [(w - 1) / 2] : [w / 2 - 1, w / 2];
  return rows.flatMap((r) => cols.map((c) => r * w + c));
}

const inside = (b: Board, r: number, c: number) => r >= 0 && r < b.h && c >= 0 && c < b.w && b.mask[r * b.w + c];

/** Orthogonal neighbours in plot order up, down, left, right (as v5). */
export function adj(b: Board, i: number): number[] {
  const r = Math.floor(i / b.w), c = i % b.w, o: number[] = [];
  if (inside(b, r - 1, c)) o.push(i - b.w);
  if (inside(b, r + 1, c)) o.push(i + b.w);
  if (inside(b, r, c - 1)) o.push(i - 1);
  if (inside(b, r, c + 1)) o.push(i + 1);
  return o;
}

export function dia(b: Board, i: number): number[] {
  const r = Math.floor(i / b.w), c = i % b.w, o: number[] = [];
  for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) if (inside(b, r + dr, c + dc)) o.push((r + dr) * b.w + c + dc);
  return o;
}

/** A square is on the edge if any orthogonal side leaves the plot. */
export const isEdge = (b: Board, i: number) => adj(b, i).length < 4;

/** Squares sharing a row (same r) or column with i, excluding i itself, within the plot. */
export function rowCol(b: Board, i: number): { row: number[]; col: number[] } {
  const r = Math.floor(i / b.w), c = i % b.w;
  const row: number[] = [], col: number[] = [];
  for (let k = 0; k < b.w; k++) if (k !== c && b.mask[r * b.w + k]) row.push(r * b.w + k);
  for (let k = 0; k < b.h; k++) if (k !== r && b.mask[k * b.w + c]) col.push(k * b.w + c);
  return { row, col };
}

/** Full rows and columns (each row/column's plot squares, if 3 or more). */
export function lines(b: Board): number[][] {
  const out: number[][] = [];
  for (let r = 0; r < b.h; r++) {
    const L = [];
    for (let c = 0; c < b.w; c++) if (b.mask[r * b.w + c]) L.push(r * b.w + c);
    if (L.length >= 3) out.push(L);
  }
  for (let c = 0; c < b.w; c++) {
    const L = [];
    for (let r = 0; r < b.h; r++) if (b.mask[r * b.w + c]) L.push(r * b.w + c);
    if (L.length >= 3) out.push(L);
  }
  return out;
}

export const plotSquares = (b: Board) => b.mask.flatMap((m, i) => (m ? [i] : []));

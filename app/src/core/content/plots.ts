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

export const PLOTS: PlotDef[] = [
  { id: 'raised-bed', name: 'Raised Bed', twist: 'A plain square bed with one sunny spot.', targets: [16, 37, 64],
    map: ['....', '.*..', '....', '....'] },
  { id: 'pond-corner', name: 'Pond Corner', twist: 'An old pond fills one corner.', targets: [16, 37, 64],
    map: ['PP...', 'P....', '.....', '.... '] },
  { id: 'stone-path', name: 'Stone Path', twist: 'A path of stepping stones splits the bed.', targets: [16, 37, 64],
    map: ['..#..', '..#..', '.....', '..#..'] },
  { id: 'old-oak', name: 'The Old Oak', twist: 'A great oak already stands here, shading its neighbours.', targets: [16, 37, 64],
    map: ['.....', '.O...', '.....', '...  '] },
  { id: 'north-wall', name: 'North Wall', twist: 'A wall shades the back row; the front is in full sun.', targets: [16, 37, 64],
    map: ['~~~~', '....', '....', '*..*'] },
  { id: 'brook', name: 'The Brook', twist: 'A stream runs down one side.', targets: [16, 37, 64],
    map: ['S....', 'S....', 'SS...', ' ....'] },
  { id: 'long-border', name: 'Long Border', twist: 'A long, thin border: every square is on the edge.', targets: [16, 37, 64],
    map: ['........', '........'] },
  { id: 'corner-plot', name: 'Corner Plot', twist: 'An L-shaped plot round the corner of the house.', targets: [16, 37, 64],
    map: ['..  ', '..  ', '....', '....', '....'] },
  { id: 'sun-trap', name: 'Sun Trap', twist: 'Three sunny squares, but a stone in the middle.', targets: [16, 37, 64],
    map: ['*...', '.#..', '...*', '..*.', '.   '] },
  { id: 'lily-pond', name: 'Lily Pond', twist: 'A pond in the middle of the garden.', targets: [16, 37, 64],
    map: ['.....', '.PP..', '.....', '...  '] },
];

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

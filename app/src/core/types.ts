import type { Board } from './board';

export type Group = 'tree' | 'plant' | 'fungus' | 'flower' | 'animal' | 'water' | 'none';
export type Archetype = 'wetland' | 'woodland' | 'meadow' | 'wildlife';

/** A planted tile. `b` is a permanent bonus gained over time, `f` marks a pre-placed plot feature. */
export interface Tile {
  s: string;
  b?: number;
  f?: 1;
}
export type Grid = (Tile | null)[];

/** Phase 1 mechanics, each behind its own flag. All off = v5 rules exactly. */
export interface Features {
  bag: boolean;
  life: boolean;
  plots: boolean;
  tools: boolean;
  wishes: boolean;
  /** Phase 1 species and rule pools (and buffs) instead of the v5 ones */
  content: boolean;
}

export const V5_FEATURES: Features = { bag: false, life: false, plots: false, tools: false, wishes: false, content: false };
export const P1_FEATURES: Features = { bag: true, life: true, plots: true, tools: true, wishes: true, content: true };

export interface ScoreCtx {
  board: Board;
  grid: Grid;
  rules: ReadonlySet<string>;
  /** 0 Spring, 1 Summer, 2 Autumn */
  season: number;
  weather: string | null;
  features: Features;
}

/** What a species' score function sees about its square. */
export interface CellView {
  i: number;
  s: string;
  tile: Tile;
  ctx: ScoreCtx;
  /** species ids of real neighbours used for the species' own scoring (diagonals included for animals under Wide Wings) */
  nb: string[];
  /** species ids of real orthogonal neighbours */
  ad: string[];
  cnt(pred: (s: string) => boolean): number;
  /** does species x count as group t (Wet Meadow etc. applied) */
  is(x: string, t: Group): boolean;
  group(x: string): Group;
  /** neighbour shading or a shade-wall square */
  shaded(): boolean;
  /** species ids of real tiles in the same row and column (excluding self) */
  rowCol(): string[];
  /** all real species ids in the garden */
  all(): string[];
  /** empty plot squares orthogonally adjacent */
  empties(): number;
}

export type Verb =
  | { kind: 'grow'; into: string }
  | { kind: 'spread' }
  | { kind: 'scale'; when: Group; amount: number }
  | { kind: 'peak'; season: number };

export interface SpeciesDef {
  id: string;
  name: string;
  icon: string;
  group: Group;
  /** also counts as these groups (e.g. Cherry is a tree and a flower) */
  also?: Group[];
  arch: Archetype[];
  text: string;
  score(v: CellView): number;
  shades?: boolean;
  verb?: Verb;
  /** in the v5 pool */
  v5?: boolean;
  /** in the Phase 1 pool */
  p1?: boolean;
  /** not draftable (e.g. Oak grown from an Acorn is draftable, but Rock is not) */
  hidden?: boolean;
  /** Phase 1 revision of a v5 species: replaces text and score when features.content */
  revised?: { text: string; score(v: CellView): number };
}

export interface RuleDef {
  id: string;
  name: string;
  text: string;
  v5?: boolean;
  p1?: boolean;
  /** keystone rules change how verbs or placement work */
  keystone?: boolean;
  preMul?(v: CellView): number;
  cellAdd?(v: CellView): number;
  postMul?(v: CellView): number;
  bonus?(ctx: ScoreCtx): number;
  /** extra group membership, e.g. water counts as flower */
  alsoIs?(x: string, t: Group, group: Group): boolean;
}

export interface WeatherDef {
  id: string;
  name: string;
  text: string;
  add(g: Group): number;
}

// Save codes: the whole profile (and any garden in progress) as text to copy somewhere safe,
// since there are no accounts. Compressed when the browser supports it.
import type { Profile } from './core/profile';
import type { RunState } from './core/run';
import type { LogEntry } from './core/stats';

export interface SaveBundle {
  v: 1;
  profile: Profile;
  run: RunState | null;
}

const toB64 = (bytes: Uint8Array) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function exportCode(b: SaveBundle): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(b));
  if (typeof CompressionStream === 'function') return 'PG1.' + toB64(await pipe(raw, new CompressionStream('deflate-raw')));
  return 'PG0.' + toB64(raw);
}

export async function importCode(code: string): Promise<SaveBundle> {
  const c = code.replace(/\s+/g, '');
  const [tag, body] = [c.slice(0, 4), c.slice(4)];
  if (tag !== 'PG1.' && tag !== 'PG0.') throw new Error('This doesn’t look like a Pocket Garden save code.');
  let bytes: Uint8Array;
  try {
    bytes = fromB64(body);
    if (tag === 'PG1.') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  } catch {
    throw new Error('The save code is incomplete or damaged. Check it was copied in full.');
  }
  const b = JSON.parse(new TextDecoder().decode(bytes)) as SaveBundle;
  if (b?.v !== 1 || !b.profile || b.profile.v !== 1) throw new Error('This save code is from a version this app can’t read.');
  return b;
}

// Stats codes: just the play log, for sending to whoever is tuning the game.

export async function exportStats(log: LogEntry[]): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify({ v: 1, log }));
  if (typeof CompressionStream === 'function') return 'PGS1.' + toB64(await pipe(raw, new CompressionStream('deflate-raw')));
  return 'PGS0.' + toB64(raw);
}

export async function importStats(code: string): Promise<LogEntry[]> {
  const c = code.replace(/\s+/g, '');
  const tag = c.slice(0, 5);
  if (tag !== 'PGS1.' && tag !== 'PGS0.') throw new Error('Not a Pocket Garden stats code.');
  let bytes: Uint8Array = fromB64(c.slice(5));
  if (tag === 'PGS1.') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  const d = JSON.parse(new TextDecoder().decode(bytes));
  if (d?.v !== 1 || !Array.isArray(d.log)) throw new Error('Unreadable stats code.');
  return d.log as LogEntry[];
}

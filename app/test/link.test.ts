import { describe, expect, it } from 'vitest';
import { decodeLink, encodeLink, linkFor } from '../src/core/link';
import { apply, newRun } from '../src/core/run';
import { emptyProfile, laneStars, recordRun } from '../src/core/profile';
import { PLOT_WISHES, poolAt } from '../src/core/content/progress';
import { P1_FEATURES, V5_FEATURES } from '../src/core/types';
import { exportCode, importCode } from '../src/savecode';

describe('garden links', () => {
  it('round-trip', () => {
    const l = { seed: 1234567, plot: 'brook', daily: false, stars: 7, features: P1_FEATURES, score: 140, won: true };
    expect(decodeLink(encodeLink(l))).toEqual(l);
    const v = { seed: 20261110, plot: null, daily: true, stars: null, features: V5_FEATURES, score: 0, won: false };
    expect(decodeLink(encodeLink(v))).toEqual(v);
  });
  it('rejects junk and unknown plots', () => {
    expect(decodeLink('nope')).toBeNull();
    expect(decodeLink(encodeLink({ seed: 1, plot: 'moon', daily: false, stars: 0, features: P1_FEATURES, score: 0, won: false }))).toBeNull();
  });
  it('a link replays the same garden: same weather, offers and first draws', () => {
    const cfg = { seed: 99, features: P1_FEATURES, plot: 'pond-corner', wishes: PLOT_WISHES['pond-corner'], pool: poolAt(4), poolStars: 4 };
    const a = newRun(cfg);
    const l = decodeLink(encodeLink(linkFor(a)))!;
    const b = newRun({ seed: l.seed, features: l.features, plot: l.plot!, wishes: PLOT_WISHES[l.plot!], pool: poolAt(l.stars!), shared: true });
    expect(b.mods).toEqual(a.mods);
    expect(b.offer).toEqual(a.offer);
    const pick = (s: typeof a) => apply(s, { type: 'draft', id: s.offer[0] }).state;
    expect(pick(b).offer).toEqual(pick(a).offer);
  });
  it('shared gardens never change the Lane', () => {
    const s = { ...newRun({ seed: 1, features: P1_FEATURES, plot: 'raised-bed', wishes: PLOT_WISHES['raised-bed'], shared: true }), phase: 'won' as const, stars: 3, banked: 100, wishDone: [true, true, true] };
    const o = recordRun(emptyProfile(), s);
    expect(laneStars(o.profile)).toBe(0);
    expect(o.profile.lane['raised-bed']).toBeUndefined();
  });
});

describe('save codes', () => {
  it('round-trip a profile and a run', async () => {
    const p = recordRun(emptyProfile(), { ...newRun({ seed: 3, features: P1_FEATURES, plot: 'raised-bed', wishes: PLOT_WISHES['raised-bed'] }), phase: 'won', stars: 1, banked: 90, wishDone: [true, false, false] }).profile;
    const run = newRun({ seed: 4, features: P1_FEATURES, plot: 'brook' });
    const code = await exportCode({ v: 1, profile: p, run });
    expect(code.startsWith('PG1.')).toBe(true);
    const back = await importCode(code.replace(/(.{40})/g, '$1\n'));
    expect(back.profile).toEqual(p);
    expect(back.run).toEqual(run);
  });
  it('explains bad codes', async () => {
    await expect(importCode('hello')).rejects.toThrow(/doesn’t look like/);
    await expect(importCode('PG1.AAAA')).rejects.toThrow(/damaged/);
  });
});

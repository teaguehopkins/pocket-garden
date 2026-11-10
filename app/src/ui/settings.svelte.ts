// Player settings, kept on the device.
const KEY = 'pg3-settings';

interface Settings {
  sound: boolean;
  haptics: boolean;
  /** 'system' follows the device; otherwise forces light or dark */
  theme: 'system' | 'light' | 'dark';
}

function load(): Settings {
  const d: Settings = { sound: true, haptics: true, theme: 'system' };
  try {
    return { ...d, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return d;
  }
}

export const settings = $state<Settings>(load());

export function saveSettings() {
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(settings)));
  } catch {
    /* ignore */
  }
  applyTheme();
}

export function applyTheme() {
  const el = document.documentElement;
  if (settings.theme === 'system') delete el.dataset.theme;
  else el.dataset.theme = settings.theme;
}

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

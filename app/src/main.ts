import { mount } from 'svelte';
import './art/tokens.css';
import './ui/app.css';
import App from './ui/App.svelte';
import Gallery from './art/Gallery.svelte';
import Defs from './art/Defs.svelte';

const root = document.getElementById('root')!;
mount(Defs, { target: document.body });
mount(location.hash === '#gallery' ? Gallery : App, { target: root });

// Offline support: register the service worker in production builds; it updates itself quietly.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}

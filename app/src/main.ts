import { mount } from 'svelte';
import './art/tokens.css';
import './ui/app.css';
import App from './ui/App.svelte';
import Gallery from './art/Gallery.svelte';
import Defs from './art/Defs.svelte';

const root = document.getElementById('root')!;
mount(Defs, { target: document.body });
mount(location.hash === '#gallery' ? Gallery : App, { target: root });

import { UTILS } from './utils.js';
import { VIEWER } from './viewer.js';
import { GRAPH } from './graph.js';
import { VERSIONING } from './versioning.js';
import { ICONS } from './icons.js';
import { CONTROL } from './control.js';

document.addEventListener('contextmenu', event => event.preventDefault());

const MAIN = (p5) => {
  var global = {p5: p5};
  UTILS(global);
  VIEWER(global);
  GRAPH(global);
  VERSIONING(global);
  ICONS(global);
  CONTROL(global);
}

new p5(MAIN);
import { UTILS } from './utils.js';
import { TEXT } from './text.js';
import { RDF } from './rdf.js';
import { ANIMATION }  from './animation.js';
import { GRAPH } from './graph.js';
import { ICONS } from './icons.js';
import { CONTROL } from './control.js';

document.addEventListener('contextmenu', event => event.preventDefault());

const MAIN = (p5) => {
  var global = {p5: p5, id: 0};
  UTILS(global);
  TEXT(global);
  ANIMATION(global);
  RDF(global);
  GRAPH(global);
  ICONS(global);
  CONTROL(global);
}

new p5(MAIN);
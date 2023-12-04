import { UTILS } from './utils.js';
import { TEXT } from './text.js';
import { RDF } from './rdf.js';
import { GRAPH } from './graph.js';
import { VERSIONING } from './versioning.js';
import { ICONS } from './icons.js';
import { CONTROL } from './control.js';

document.addEventListener('contextmenu', event => event.preventDefault());

const MAIN = (p5) => {
  var global = {p5: p5};
  UTILS(global);
  TEXT(global);
  RDF(global);
  GRAPH(global);
  VERSIONING(global);
  ICONS(global);
  CONTROL(global);
}

new p5(MAIN);
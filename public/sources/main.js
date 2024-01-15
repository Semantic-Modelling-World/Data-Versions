/*import { UTILS } from './sources/utils.js';
import { TEXT } from './sources/text.js';
import { ANIMATION } from './sources/animation.js';
import { GRAPH } from './sources/graph.js';
import { ICONS } from './sources/icons.js';
import { CONTROL } from './sources/control.js';*/

document.addEventListener('contextmenu', event => event.preventDefault());

const MAIN = (p5) => {
  const canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight);
  var global = { p5: p5, id: 0, Mat: new Matrix(), canvas};

  UTILS(global);
  TEXT(global);
  ANIMATION(global);
  GRAPH(global);
  ICONS(global);
  CONTROL(global);
}

new p5(MAIN);
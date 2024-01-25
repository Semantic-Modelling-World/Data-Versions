import { UTILS } from './utils.js';
import { TEXT } from './text.js';
import { ANIMATION } from './animation.js';
import { GRAPH } from './graph.js';
import { BUTTONS } from './buttons.js';
import { CONTROL } from './level_control.js';

document.addEventListener('contextmenu', event => event.preventDefault());

const MAIN = (p5) => {
  const canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight);
  var exp = { p5: p5, id: 0, Mat: new Matrix(), canvas };
  UTILS(exp);
  TEXT(exp);
  ANIMATION(exp);
  GRAPH(exp);
  BUTTONS(exp);
  CONTROL(exp);
}

new p5(MAIN);
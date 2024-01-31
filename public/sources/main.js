document.addEventListener('contextmenu', event => event.preventDefault());

const MAIN = (p5) => {
  // p5 is only available in a function context, which is why we wrap all code
  // into functions and exchange variables via the exp argument.
  const canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight);
  var exp = { p5: p5, id: 0, canvas };
  UTILS(exp);
  TEXT(exp);
  ANIMATION(exp);
  GRAPH(exp);
  BUTTONS(exp);
  CONTROL(exp);
}

new p5(MAIN);
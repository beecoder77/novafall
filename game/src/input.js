// Keyboard and mouse state for the game: held keys, the pointer position in
// arena coordinates, click edges for menus, and the keys the screens poll.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouseX: 640,
    mouseY: 360,
    mouseDown: false,
    clicked: false,      // true for one frame after a mousedown
    pressed: new Set(),  // key codes that went down this frame
  };

  const toArena = (ev) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = ((ev.clientX - r.left) / r.width) * canvas.width;
    input.mouseY = ((ev.clientY - r.top) / r.height) * canvas.height;
  };

  window.addEventListener('keydown', (ev) => {
    if (!ev.repeat) input.pressed.add(ev.code);
    input.keys.add(ev.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(ev.code)) {
      ev.preventDefault();
    }
  });
  window.addEventListener('keyup', (ev) => input.keys.delete(ev.code));
  canvas.addEventListener('mousemove', toArena);
  canvas.addEventListener('mousedown', (ev) => {
    toArena(ev);
    input.mouseDown = true;
    input.clicked = true;
  });
  window.addEventListener('mouseup', () => { input.mouseDown = false; });
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

  input.endFrame = () => {
    input.clicked = false;
    input.pressed.clear();
  };
  input.wasPressed = (code) => input.pressed.has(code);
  input.down = (code) => input.keys.has(code);
  return input;
}

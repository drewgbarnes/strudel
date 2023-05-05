/*
draw.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/tone/draw.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern } from './index.mjs';

export const getDrawContext = (id = 'test-canvas') => {
  let canvas = document.querySelector('#' + id);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style = 'pointer-events:none;width:100%;height:100%;position:fixed;top:0;left:0;z-index:5';
    document.body.prepend(canvas);
  }
  return canvas.getContext('2d');
};

export const cleanupDraw = (clearScreen = true) => {
  const ctx = getDrawContext();
  clearScreen && ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
};

Pattern.prototype.onPaint = function (onPaint) {
  // this is evil! TODO: add pattern.context
  this.context = { onPaint };
  return this;
};

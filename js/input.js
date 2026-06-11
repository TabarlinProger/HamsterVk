/**
 * input.js — обработка ввода (мышь + тач)
 */
class InputHandler {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Renderer} renderer
   * @param {function} onTileTap  callback(row, col)
   */
  constructor(canvas, renderer, onTileTap) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.onTileTap = onTileTap;
    this._hovered = null;

    this._bindEvents();
  }

  _bindEvents() {
    // Мышь
    this.canvas.addEventListener('click', (e) => this._handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this._handleMove(e));
    this.canvas.addEventListener('mouseleave', () => {
      this._hovered = null;
      this.canvas.style.cursor = 'default';
    });

    // Тач
    this.canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
  }

  /** Получить координаты события относительно canvas */
  _getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.renderer.viewWidth() / rect.width;
    const scaleY = this.renderer.viewHeight() / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  _handleClick(e) {
    const pos = this._getPos(e);
    const cell = this.renderer.pixelToCell(pos.x, pos.y);
    if (cell) this.onTileTap(cell.row, cell.col);
  }

  _handleMove(e) {
    const pos = this._getPos(e);
    const cell = this.renderer.pixelToCell(pos.x, pos.y);
    if (cell) {
      this.canvas.style.cursor = 'pointer';
      this._hovered = cell;
    } else {
      this.canvas.style.cursor = 'default';
      this._hovered = null;
    }
  }

  // ---- touch ----

  _onTouchStart(e) {
    if (e.touches.length === 1) {
      this._touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
    e.preventDefault();
  }

  _onTouchEnd(e) {
    if (!this._touchStart) return;
    const dx = (e.changedTouches[0]?.clientX || 0) - this._touchStart.x;
    const dy = (e.changedTouches[0]?.clientY || 0) - this._touchStart.y;
    const dt = Date.now() - this._touchStart.time;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Тап, если короткое нажатие без значительного сдвига
    if (dt < 300 && dist < 10) {
      const pos = this._getPos({
        clientX: this._touchStart.x,
        clientY: this._touchStart.y
      });
      const cell = this.renderer.pixelToCell(pos.x, pos.y);
      if (cell) this.onTileTap(cell.row, cell.col);
    }
    this._touchStart = null;
    e.preventDefault();
  }

  _onTouchMove(e) {
    // Если сильно сдвинулись — отменяем тап
    if (this._touchStart && e.touches.length === 1) {
      const dx = e.touches[0].clientX - this._touchStart.x;
      const dy = e.touches[0].clientY - this._touchStart.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        this._touchStart = null;
      }
    }
    e.preventDefault();
  }
}

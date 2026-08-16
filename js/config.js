/**
 * config.js — константы и настройки игры «Сортируй Плитки»
 */
const CONFIG = {
  // Цвета плиток по направлениям
  TILE_COLORS: {
    up:    '#4A90D9',
    down:  '#6ABF4B',
    left:  '#F5A623',
    right: '#9B59B6'
  },

  // Цвета стрелок
  ARROW_COLOR: '#FFFFFF',

  // Анимации (мс)
  ANIMATION: {
    MOVE_DURATION: 684,
    EXIT_DURATION: 25,
    SHAKE_DURATION: 500,
    WIN_REVEAL_DURATION: 600,
    STAR_POP_DURATION: 400,
    ROTATE_DURATION: 250
  },

  // Сетка
  CELL_GAP: 4,
  CELL_RADIUS: 0.12,
  MIN_TILE_SIZE: 40,
  MAX_TILE_SIZE: 110,

  // Фон
  OVERLAY_ALPHA: 0.75,

  // Игровой процесс
  STORAGE_KEY: 'sortTiles_progress',
  MAX_UNDO_HISTORY: 50,
  INITIAL_HINTS: 3,
  MAX_LIVES: 3,
  DEFAULT_TIME_LIMIT: 120,

  // Специальные механики
  PORTAL_COLOR: '#FF6B6B',
  WALL_CLOSED_COLOR: '#555555',
  WALL_OPEN_COLOR: 'rgba(100,200,100,0.3)',
  ROTATING_INDICATOR: '#FFD700',
  ROTATING_READY_COLOR: '#2EFF7E',

  // Звёзды
  STAR_RATIOS: {
    3: 1.0,    // ≤ optimal
    2: 1.5,    // ≤ optimal * 1.5
    1: Infinity // любой результат
  }
};

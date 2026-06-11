/**
 * sound.js — управление звуками и музыкой
 */
class SoundManager {
  constructor() {
    this._enabled = true;
    this._sounds = {};
    this._currentMusic = null;
    this._unlocked = false;
    this._pendingMusic = null;

    var names = ['Menu', 'Win', 'Los', 'Click', 'Hit', 'Move', 'Leaf', 'MovePipe', 'EndMove', 'Push'];
    for (var i = 0; i < names.length; i++) {
      var audio = new Audio('Sound/' + names[i] + '.ogg');
      audio.preload = 'auto';
      if (names[i] === 'Menu') {
        audio.loop = true;
      }
      this._sounds[names[i]] = audio;
    }

    // Загружаем 5 вариантов игровой музыки
    this._gameMusic = [];
    for (var gi = 0; gi < 5; gi++) {
      var audio = new Audio('Sound/Game_' + gi + '.ogg');
      audio.preload = 'auto';
      audio.loop = true;
      this._gameMusic.push(audio);
    }

    // Click звук на любую кнопку + разблокировка аудио
    var self = this;
    var unlock = function() {
      if (self._unlocked) return;
      self._unlocked = true;
      // Воспроизводим тишину, чтобы разблокировать Audio в браузере
      var silent = new Audio('Sound/Click.ogg');
      silent.volume = 0.001;
      silent.play().catch(function() {});
      // Если была отложена музыка — запускаем
      if (self._pendingMusic && self._enabled) {
        var pending = self._pendingMusic;
        self._pendingMusic = null;
        // Может быть отложен 'Menu' или 'Game_X'
        var audio = self._sounds[pending] || null;
        // Поищем среди игровых
        if (!audio) {
          for (var gi = 0; gi < self._gameMusic.length; gi++) {
            if (self._gameMusic[gi].src.indexOf(pending) !== -1) {
              audio = self._gameMusic[gi];
              break;
            }
          }
        }
        self._currentMusic = audio;
        if (self._currentMusic) {
          self._currentMusic.currentTime = 0;
          self._currentMusic.play().catch(function() {});
        }
      }
    };
    document.addEventListener('click', function(e) {
      unlock();
      var el = e.target;
      while (el) {
        if (el.tagName === 'BUTTON' || el.classList.contains('btn') || el.classList.contains('btn-back') || el.classList.contains('chapter-slide') || el.classList.contains('level-card')) {
          self.play('Click');
          return;
        }
        el = el.parentElement;
      }
    });
    document.addEventListener('touchstart', unlock, { once: true });
  }

  play(name) {
    if (!this._enabled) return;
    var audio = this._sounds[name];
    if (!audio) return;

    // Музыкальные треки
    if (name === 'Menu') {
      if (this._currentMusic === audio && !audio.paused) return;
      this._stopCurrentMusic();
      this._currentMusic = audio;
      // Если аудио ещё не разблокировано — откладываем
      if (!this._unlocked) {
        this._pendingMusic = name;
        return;
      }
    }

    audio.currentTime = 0;
    try { audio.play().catch(function() {}); } catch(e) {}
  }

  playRandomGameMusic() {
    if (!this._enabled) return;
    this._stopCurrentMusic();
    var idx = Math.floor(Math.random() * this._gameMusic.length);
    var audio = this._gameMusic[idx];
    this._currentMusic = audio;

    if (!this._unlocked) {
      this._pendingMusic = 'Game_' + idx;
      return;
    }

    audio.currentTime = 0;
    try { audio.play().catch(function() {}); } catch(e) {}
  }

  _stopCurrentMusic() {
    if (this._currentMusic) {
      this._currentMusic.pause();
      this._currentMusic.currentTime = 0;
      this._currentMusic = null;
    }
  }

  stopMusic() {
    this._pendingMusic = null;
    this._stopCurrentMusic();
  }

  toggle() {
    this._enabled = !this._enabled;
    if (!this._enabled) this.stopMusic();
    return this._enabled;
  }

  isEnabled() {
    return this._enabled;
  }
}

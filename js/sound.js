/**
 * sound.js — управление звуками и музыкой
 */
class SoundManager {
  constructor() {
    this._sfxEnabled = true;
    this._musicVolume = 0.2;
    this._sounds = {};
    this._buffers = {};
    this._audioCtx = null;
    this._musicSource = null;
    this._musicGain = null;
    this._masterGain = null;
    this._musicStartedAt = 0;
    this._musicOffset = 0;
    this._currentMusic = null;
    this._currentMusicName = null;
    this._lastMusicName = null;
    this._unlocked = false;
    this._pendingMusic = null;
    this._suspendedByGame = false;
    this._pauseReasons = {};
    this._useWebAudio = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext) && typeof fetch === 'function';

    if (this._useWebAudio) {
      try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        this._audioCtx = new AudioCtx();
        this._masterGain = this._audioCtx.createGain();
        this._masterGain.gain.value = 1;
        this._masterGain.connect(this._audioCtx.destination);
      } catch(e) {
        this._useWebAudio = false;
      }
    }

    var names = ['Menu', 'Win', 'Los', 'Click', 'Hit', 'Move', 'Leaf', 'MovePipe', 'EndMove', 'Push'];
    for (var i = 0; i < names.length; i++) {
      var url = 'Sound/' + names[i] + '.ogg';
      if (this._useWebAudio) {
        this._loadBuffer(names[i], url);
      } else {
        var audio = new Audio(url);
        audio.preload = 'auto';
        audio.controls = false;
        audio.disableRemotePlayback = true;
        if (names[i] === 'Menu') {
          audio.loop = true;
        }
        this._sounds[names[i]] = audio;
      }
    }

    // Загружаем 5 вариантов игровой музыки
    this._gameMusic = [];
    for (var gi = 0; gi < 5; gi++) {
      var musicName = 'Game_' + gi;
      var musicUrl = 'Sound/' + musicName + '.ogg';
      if (this._useWebAudio) {
        this._loadBuffer(musicName, musicUrl);
        this._gameMusic.push(musicName);
      } else {
        var gameAudio = new Audio(musicUrl);
        gameAudio.preload = 'auto';
        gameAudio.loop = true;
        gameAudio.controls = false;
        gameAudio.disableRemotePlayback = true;
        this._gameMusic.push(gameAudio);
      }
    }

    this._clearMediaSession();

    var self = this;
    document.addEventListener('click', function(e) {
      self.tryAutoUnlock();
      var el = e.target;
      while (el) {
        if (el.tagName === 'BUTTON' || el.classList.contains('btn') || el.classList.contains('btn-back') || el.classList.contains('chapter-slide') || el.classList.contains('level-card')) {
          self.play('Click');
          return;
        }
        el = el.parentElement;
      }
    });
    document.addEventListener('touchstart', function() { self.tryAutoUnlock(); }, { once: true });
  }

  tryAutoUnlock(callback) {
    var self = this;
    if (!this._unlocked) {
      this._unlocked = true;
      if (!this._useWebAudio) {
        var silent = new Audio('Sound/Click.ogg');
        silent.volume = 0.001;
        silent.controls = false;
        silent.disableRemotePlayback = true;
        silent.play().catch(function() {});
      }
    }
    var done = function() {
      self._flushPendingMusic();
      if (callback) callback();
    };
    if (this._audioCtx && this._audioCtx.state === 'suspended') {
      this._audioCtx.resume().then(done).catch(done);
    } else {
      done();
    }
  }

  startMenuMusic() {
    this._lastMusicName = 'Menu';
    if (this._isPaused()) {
      this._pendingMusic = 'Menu';
      return;
    }
    var self = this;
    this.tryAutoUnlock(function() {
      if (self._isPaused()) {
        self._pendingMusic = 'Menu';
        return;
      }
      self._playMusic('Menu', 0);
      if (!self._musicSource) self._pendingMusic = 'Menu';
    });
  }

  _flushPendingMusic() {
    if (!this._pendingMusic || this._isPaused()) return;
    var pending = this._pendingMusic;
    this._pendingMusic = null;
    this._playMusic(pending, 0);
    if (!this._musicSource && !this._buffers[pending]) {
      this._pendingMusic = pending;
    }
  }

  _clearMediaSession() {
    try {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack'].forEach(function(action) {
          try { navigator.mediaSession.setActionHandler(action, null); } catch(e) {}
        });
      }
    } catch(e) {}
  }

  _loadBuffer(name, url) {
    var self = this;
    fetch(url)
      .then(function(res) { return res.arrayBuffer(); })
      .then(function(data) { return self._audioCtx.decodeAudioData(data); })
      .then(function(buffer) {
        self._buffers[name] = buffer;
        if (self._isPaused()) return;
        if (self._pendingMusic === name || self._lastMusicName === name) {
          self._flushPendingMusic();
        }
      })
      .catch(function() {});
  }

  play(name) {
    if (name !== 'Menu' && !this._sfxEnabled) return;
    if (this._isPaused()) return;
    if (this._useWebAudio) {
      if (name === 'Menu') {
        this._playMusic(name, 0);
      } else {
        this._playBuffer(name, false, 0);
      }
      return;
    }
    var audio = this._sounds[name];
    if (!audio) return;

    // Музыкальные треки
    if (name === 'Menu') {
      if (this._currentMusic === audio && !audio.paused) return;
      this._stopCurrentMusic();
      this._currentMusic = audio;
      audio.volume = this._musicVolume;
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
    if (this._isPaused()) return;
    var idx = Math.floor(Math.random() * this._gameMusic.length);
    var audio = this._gameMusic[idx];

    if (this._useWebAudio) {
      this._playMusic(audio, 0);
      return;
    }

    this._stopCurrentMusic();
    this._currentMusic = audio;
    audio.volume = this._musicVolume;

    if (!this._unlocked) {
      this._pendingMusic = 'Game_' + idx;
      return;
    }

    audio.currentTime = 0;
    try { audio.play().catch(function() {}); } catch(e) {}
  }

  _stopCurrentMusic() {
    if (this._useWebAudio) {
      if (this._musicSource) {
        try { this._musicSource.stop(); } catch(e) {}
      }
      this._musicSource = null;
      this._musicGain = null;
      this._currentMusicName = null;
      this._musicOffset = 0;
      return;
    }
    if (this._currentMusic) {
      this._currentMusic.pause();
      this._currentMusic.currentTime = 0;
      this._currentMusic = null;
    }
  }

  stopMusic() {
    this._pendingMusic = null;
    this._lastMusicName = null;
    this._stopCurrentMusic();
  }

  _playBuffer(name, loop, offset) {
    if (!this._audioCtx || !this._buffers[name]) return null;
    if (this._isPaused()) return null;
    if (!this._unlocked) {
      if (loop) this._pendingMusic = name;
      return null;
    }
    if (this._audioCtx.state === 'suspended') {
      this._audioCtx.resume().catch(function() {});
    }
    var source = this._audioCtx.createBufferSource();
    var gain = this._audioCtx.createGain();
    gain.gain.value = loop ? this._musicVolume : 1;
    source.buffer = this._buffers[name];
    source.loop = !!loop;
    source.connect(gain);
    gain.connect(this._masterGain || this._audioCtx.destination);
    source.start(0, offset || 0);
    return { source: source, gain: gain };
  }

  _playMusic(name, offset, forceRestart) {
    if (!forceRestart && this._currentMusicName === name && this._musicSource) return;
    this._lastMusicName = name;
    if (!this._unlocked) {
      this._currentMusicName = name;
      this._pendingMusic = name;
      return;
    }
    this._stopCurrentMusic();
    this._currentMusicName = name;
    var node = this._playBuffer(name, true, offset || 0);
    if (node) {
      this._musicSource = node.source;
      this._musicGain = node.gain;
      this._applyMusicVolume();
      this._musicStartedAt = this._audioCtx.currentTime - (offset || 0);
      this._musicOffset = offset || 0;
    } else if (!this._buffers[name]) {
      this._pendingMusic = name;
    }
  }

  _isPaused() {
    return !!(this._pauseReasons.ad || this._pauseReasons.platform || this._suspendedByGame);
  }

  _hasPauseReason() {
    return !!(this._pauseReasons.ad || this._pauseReasons.platform);
  }

  pauseAll(reason) {
    reason = reason || 'platform';
    this._pauseReasons[reason] = true;
    this._suspendedByGame = true;
    if (this._useWebAudio) {
      if (this._masterGain) {
        try { this._masterGain.gain.setValueAtTime(0, this._audioCtx.currentTime); } catch(e) { this._masterGain.gain.value = 0; }
      }
      if (this._audioCtx && this._audioCtx.state === 'running') {
        this._audioCtx.suspend().catch(function() {});
      }
      return;
    }
    for (var name in this._sounds) {
      try { this._sounds[name].pause(); } catch(e) {}
    }
    for (var i = 0; i < this._gameMusic.length; i++) {
      try { this._gameMusic[i].pause(); } catch(e) {}
    }
  }

  resumeAll(reason) {
    reason = reason || 'platform';
    delete this._pauseReasons[reason];
    if (this._hasPauseReason()) return;
    this._suspendedByGame = false;
    if (this._useWebAudio) {
      if (this._masterGain) {
        try { this._masterGain.gain.setValueAtTime(1, this._audioCtx.currentTime); } catch(e) { this._masterGain.gain.value = 1; }
      }
      if (this._audioCtx && this._audioCtx.state === 'suspended') {
        this._audioCtx.resume().catch(function() {});
      }
      this._flushPendingMusic();
      return;
    }
    if (this._currentMusic && this._unlocked) {
      try { this._currentMusic.play().catch(function() {}); } catch(e) {}
    }
  }

  forceResume() {
    this._pauseReasons = {};
    this._suspendedByGame = false;
    if (this._useWebAudio) {
      if (this._masterGain) {
        try { this._masterGain.gain.setValueAtTime(1, this._audioCtx.currentTime); } catch(e) { this._masterGain.gain.value = 1; }
      }
      if (this._audioCtx && this._audioCtx.state === 'suspended') {
        this._audioCtx.resume().catch(function() {});
      }
      return;
    }
    this.resumeAll('platform');
  }

  ensureMusic(forceRestart) {
    if (this._isPaused()) return;
    if (!forceRestart && this._currentMusicName && this._musicSource) return true;
    if (this._lastMusicName) {
      this._playMusic(this._lastMusicName, 0, !!forceRestart);
      return true;
    }
    return false;
  }

  setMusicVolume(volume) {
    volume = Math.max(0, Math.min(0.4, Number(volume) || 0));
    this._musicVolume = volume;
    this._applyMusicVolume();
  }

  getMusicVolume() {
    return this._musicVolume;
  }

  _applyMusicVolume() {
    if (this._useWebAudio) {
      if (this._musicGain) {
        try { this._musicGain.gain.setValueAtTime(this._musicVolume, this._audioCtx.currentTime); } catch(e) { this._musicGain.gain.value = this._musicVolume; }
      }
      return;
    }
    if (this._currentMusic) {
      this._currentMusic.volume = this._musicVolume;
    }
    for (var i = 0; i < this._gameMusic.length; i++) {
      if (this._gameMusic[i] && typeof this._gameMusic[i].volume === 'number') {
        this._gameMusic[i].volume = this._musicVolume;
      }
    }
    var menu = this._sounds.Menu;
    if (menu) menu.volume = this._musicVolume;
  }

  toggleSfx() {
    this._sfxEnabled = !this._sfxEnabled;
    return this._sfxEnabled;
  }

  setSfxEnabled(enabled) {
    this._sfxEnabled = !!enabled;
  }

  isSfxEnabled() {
    return this._sfxEnabled;
  }
}

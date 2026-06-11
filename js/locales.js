var LOCALES = {
  ru: {
    title: 'Тап хомяк',
    continue: 'Продолжить',
    levels: 'Уровни',
    leaderboard: 'Лидеры',
    settings: 'Настройки',
    pauseTitle: 'Пауза',
    resume: 'Продолжить',
    restart: 'Заново',
    back: 'В меню',
    backNav: 'Назад',
    next: 'Дальше',
    winTitle: 'Все хомяки спасены!',
    winLevel: 'Уровень',
    winPassed: 'пройден',
    moves: 'Ходов',
    record: 'Рекорд',
    softlockTitle: 'Нет ходов',
    timeUpTitle: 'Время вышло',
    softlockText: 'Хомяки заблокированы',
    returnAd: 'Вернуться',
    skipAd: 'Пропустить',
    hintsTitle: 'Подсказки кончились',
    hintsText: 'Посмотреть рекламу и получить 3 подсказки?',
    no: 'Нет',
    watch: 'Смотреть',
    langRu: 'Русский',
    langEn: 'English',
    music: 'Звуки',
    musicOn: 'Вкл',
    musicOff: 'Выкл',
    chapter: 'Глава',
    level: 'Уровень',
    gotit: 'Понятно!',
    leaderTitle: 'Таблица лидеров',
    leaderSub: 'Проходи уровни на 3 звезды, чтобы выйти в лидеры',
    leaderNoData: 'Нет данных',
    playerName: 'Игрок'
  },
  en: {
    title: 'Tap Hamster',
    continue: 'Continue',
    levels: 'Levels',
    leaderboard: 'Leaders',
    settings: 'Settings',
    pauseTitle: 'Pause',
    resume: 'Continue',
    restart: 'Restart',
    back: 'To Menu',
    backNav: 'Back',
    next: 'Next',
    winTitle: 'All hamsters saved!',
    winLevel: 'Level',
    winPassed: 'completed',
    moves: 'Moves',
    record: 'Best',
    softlockTitle: 'No moves',
    timeUpTitle: 'Time is up',
    softlockText: 'Hamsters are blocked',
    returnAd: 'Return',
    skipAd: 'Skip',
    hintsTitle: 'No hints left',
    hintsText: 'Watch ad and get 3 hints?',
    no: 'No',
    watch: 'Watch',
    langRu: 'Русский',
    langEn: 'English',
    music: 'Sound',
    musicOn: 'On',
    musicOff: 'Off',
    chapter: 'Chapter',
    level: 'Level',
    gotit: 'Got it!',
    leaderTitle: 'Leaderboard',
    leaderSub: 'Complete levels with 3 stars to become a leader',
    leaderNoData: 'No data',
    playerName: 'Player'
  }
};

var currentLang = 'ru';

function _(key) {
  return LOCALES[currentLang][key] || LOCALES['ru'][key] || key;
}

function setLang(lang) {
  currentLang = lang;
  try {
    var data = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY));
    if (!data) data = {};
    data.lang = lang;
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
  } catch(e) {}
  applyLang();
}

function applyLang() {
  var els = document.querySelectorAll('[data-i18n]');
  for (var i = 0; i < els.length; i++) {
    var key = els[i].getAttribute('data-i18n');
    els[i].textContent = _(key);
  }
}

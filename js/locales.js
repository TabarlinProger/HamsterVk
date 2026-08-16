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
    musicVolume: 'Музыка',
    musicOn: 'Вкл',
    musicOff: 'Выкл',
    chapter: 'Глава',
    level: 'Уровень',
    gotit: 'Понятно!',
    leaderTitle: 'Таблица лидеров',
    leaderSub: 'Проходи уровни на 3 звезды, чтобы выйти в лидеры',
    leaderNoData: 'Нет данных',
    leaderLoading: 'Загрузка...',
    playerName: 'Вы',
    pageTitle: 'Сортируй Плитки: Тапай и Играй',
    tutWelcomeTitle: 'Добро пожаловать!',
    tutWelcomeText: 'Нажимай на хомяков, чтобы они двигались.\nПроведи всех хомяков к выходу — и уровень пройден!',
    tutStraightTitle: 'Трубы',
    tutStraightText: 'Прямые трубы можно вращать!\nНажми на трубу, чтобы изменить её направление.',
    tutCornerTitle: 'Угловые трубы',
    tutCornerText: 'Угловые трубы соединяют соседние стороны клетки.\nХомяк поворачивает, проходя через такую трубу!',
    tutTeleportTitle: 'Порталы',
    tutTeleportText: 'Порталы мгновенно перемещают хомяка\nк парному порталу в другом месте поля!',
    tutTimerTitle: 'Таймер',
    tutTimerText: 'На уровнях с таймером нужно успеть\nза отведённое время! Следи за часами!',
    tutHintsTitle: 'Подсказки',
    tutHintsText: 'Если не знаешь кого двигать — нажми на лупу.\nПодсказка подсветит хомяка, который может сделать ход!'
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
    musicVolume: 'Music',
    musicOn: 'On',
    musicOff: 'Off',
    chapter: 'Chapter',
    level: 'Level',
    gotit: 'Got it!',
    leaderTitle: 'Leaderboard',
    leaderSub: 'Complete levels with 3 stars to become a leader',
    leaderNoData: 'No data',
    leaderLoading: 'Loading...',
    playerName: 'You',
    pageTitle: 'Sort Tiles: Tap and Play',
    tutWelcomeTitle: 'Welcome!',
    tutWelcomeText: 'Tap hamsters to make them move.\nGuide all hamsters to the exit to complete the level!',
    tutStraightTitle: 'Pipes',
    tutStraightText: 'Straight pipes can be rotated!\nTap a pipe to change its direction.',
    tutCornerTitle: 'Corner pipes',
    tutCornerText: 'Corner pipes connect adjacent sides of a cell.\nThe hamster turns when passing through such a pipe!',
    tutTeleportTitle: 'Portals',
    tutTeleportText: 'Portals instantly move the hamster\nto the paired portal elsewhere on the board!',
    tutTimerTitle: 'Timer',
    tutTimerText: 'On timed levels you must finish\nbefore time runs out! Watch the clock!',
    tutHintsTitle: 'Hints',
    tutHintsText: 'Not sure whom to move? Tap the magnifying glass.\nA hint will highlight a hamster that can make a move!'
  }
};

var currentLang = 'ru';

function _(key) {
  return LOCALES[currentLang][key] || LOCALES['ru'][key] || key;
}

function setLang(lang, persist) {
  if (!LOCALES[lang]) lang = 'ru';
  currentLang = lang;
  if (persist === false) {
    applyLang();
    return;
  }
  try {
    var data = (typeof StorageManager !== 'undefined') ? StorageManager.load() : JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY));
    if (!data) data = {};
    data.lang = lang;
    if (typeof StorageManager !== 'undefined') StorageManager.save(data);
    else localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
  } catch(e) {}
  applyLang();
}

function applyLang() {
  document.title = _('pageTitle');
  var els = document.querySelectorAll('[data-i18n]');
  for (var i = 0; i < els.length; i++) {
    var key = els[i].getAttribute('data-i18n');
    els[i].textContent = _(key);
  }
  if (typeof game !== 'undefined' && game && typeof game._refreshDynamicLang === 'function') {
    game._refreshDynamicLang();
  }
}

function _tutorialText(id, field) {
  var cap = id.charAt(0).toUpperCase() + id.slice(1);
  return _('tut' + cap + field);
}

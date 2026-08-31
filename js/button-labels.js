(function () {
  'use strict';

  var buttons = Array.from(document.querySelectorAll('.btn:not(.btn-icon):not(.lang-btn)'));
  var context = document.createElement('canvas').getContext('2d');
  var pending = false;

  function fit() {
    pending = false;
    buttons.forEach(function (button) {
      var label = button.querySelector(':scope > span');
      if (!label || !button.getClientRects().length) return;
      var bounds = button.getBoundingClientRect();
      var style = getComputedStyle(button);
      var icon = button.querySelector(':scope > img');
      var inset = Math.max(parseFloat(style.paddingLeft), parseFloat(style.paddingRight), 8);
      var iconSpace = icon ? icon.getBoundingClientRect().width + (parseFloat(style.columnGap) || 0) : 0;
      var available = Math.max(1, bounds.width - inset * 2 - iconSpace);
      var baseSize = parseFloat(style.fontSize);
      context.font = style.fontWeight + ' ' + baseSize + 'px ' + style.fontFamily;
      var textWidth = context.measureText(label.textContent).width;
      label.style.fontSize = (baseSize * Math.min(1, available / Math.max(1, textWidth))) + 'px';
    });
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(fit);
  }

  var observer = new ResizeObserver(schedule);
  buttons.forEach(function (button) { observer.observe(button); });
  new MutationObserver(schedule).observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class']
  });
  document.fonts.ready.then(schedule);
  schedule();
}());

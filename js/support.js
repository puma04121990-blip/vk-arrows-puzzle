// ============================================
// Support contacts (VK Games rule 2.4.1)
// Замените communityUrl / email на свои реальные.
// В кабинете dev.vk.com укажите то же сообщество.
// ============================================

window.APP_SUPPORT = {
  // Сообщество игры (публичная страница / клуб)
  communityUrl: 'https://vk.com/puls_strelok',
  communityTitle: 'Сообщество «Пульс стрелок»',
  // Email для обращений (также в privacy / terms)
  email: 'puls.strelok.support@yandex.ru',
  // Тексты
  responseHint: 'Ответ в течение 7 дней'
};

window.openSupportCommunity = function () {
  const url = (window.APP_SUPPORT && window.APP_SUPPORT.communityUrl) || 'https://vk.com';
  window.openExternalUrl(url);
};

window.openSupportEmail = function () {
  const mail = (window.APP_SUPPORT && window.APP_SUPPORT.email) || '';
  if (!mail) return;
  const subject = encodeURIComponent('Пульс стрелок — поддержка');
  const href = 'mailto:' + mail + '?subject=' + subject;
  window.openExternalUrl(href);
};

window.openExternalUrl = function (url) {
  if (!url) return;
  if (typeof vkBridge !== 'undefined' && typeof vkBridge.send === 'function') {
    // mailto: and https: both via OpenURL when available
    vkBridge.send('VKWebAppOpenURL', { url: url }).catch(() => {
      try { window.open(url, '_blank'); } catch (e) {}
    });
    return;
  }
  try { window.open(url, '_blank'); } catch (e) {}
};

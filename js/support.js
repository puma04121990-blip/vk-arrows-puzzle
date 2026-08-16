// ============================================
// Support contacts (VK Games rule 2.4.1)
// Замените communityUrl / email на СВОИ реальные.
// То же сообщество укажите в кабинете dev.vk.com.
// ============================================

window.APP_SUPPORT = {
  // Укажите опубликованное сообщество VK перед модерацией. Пустое значение не выводит нерабочую кнопку.
  communityUrl: '',
  communityTitle: '',
  email: 'puls.strelok.support@yandex.ru',
  responseHint: 'Ответ в течение 7 дней'
};

window.isInsideVKClient = function () {
  if (typeof vkBridge === 'undefined' || typeof vkBridge.send !== 'function') return false;
  try {
    const s = String(window.location.search || '') + String(window.location.hash || '');
    if (/vk_user_id=|vk_app_id=|sign=/.test(s)) return true;
  } catch (e) {}
  try {
    const ref = String(document.referrer || '');
    if (/(\.|^)(vk\.com|vk\.ru|vkontakte\.ru)/i.test(ref)) return true;
  } catch (e) {}
  try {
    if (window.parent && window.parent !== window) return true;
  } catch (e) {
    return true;
  }
  return false;
};

window.openExternalUrl = function (url) {
  if (!url) return;
  const inVK = window.isInsideVKClient();
  if (inVK && typeof vkBridge !== 'undefined' && typeof vkBridge.send === 'function') {
    vkBridge.send('VKWebAppOpenURL', { url: url }).catch(() => {
      try { window.open(url, '_blank'); } catch (e) {}
    });
    return;
  }
  try {
    window.open(url, '_blank');
  } catch (e) {
    // last resort: navigate
    try { window.location.href = url; } catch (e2) {}
  }
};

window.openSupportCommunity = function () {
  const url = (window.APP_SUPPORT && window.APP_SUPPORT.communityUrl) || 'https://vk.com';
  window.openExternalUrl(url);
};

window.openSupportEmail = function () {
  const mail = (window.APP_SUPPORT && window.APP_SUPPORT.email) || '';
  if (!mail) return;
  const subject = encodeURIComponent('Пульс стрелок — поддержка');
  window.openExternalUrl('mailto:' + mail + '?subject=' + subject);
};

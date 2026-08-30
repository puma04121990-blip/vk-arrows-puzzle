'use strict';

const { handleCallback, getSecret } = require('../server/vk-payments-callback');

function asParams(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      if (body.trim().startsWith('{')) return JSON.parse(body);
    } catch (e) {}
    return Object.fromEntries(new URLSearchParams(body));
  }
  if (typeof body === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(body)) {
      out[key] = value == null ? '' : String(value);
    }
    return out;
  }
  return {};
}

module.exports = (req, res) => {
  res.setHeader('cache-control', 'no-store');

  if (req.method === 'GET' || req.method === 'HEAD') {
    res.status(200).json({
      ok: true,
      configured: Boolean(getSecret()),
      endpoint: '/vk/payments'
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const result = handleCallback(asParams(req.body));
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[VK Payments] callback error:', error);
    res.status(500).json({ error: { error_code: 1, error_msg: 'Internal callback error' } });
  }
};

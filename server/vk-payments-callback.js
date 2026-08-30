#!/usr/bin/env node
'use strict';

/**
 * Minimal VK Payments callback for Arrow Pulse.
 *
 * Required environment:
 *   VK_APP_SECRET   — secret from the VK application settings
 *   PORT            — optional, defaults to 8080
 *   VK_CALLBACK_DATA — optional JSON file path, defaults to ./server/data/orders.json
 *
 * The endpoint accepts VK's application/x-www-form-urlencoded POST callbacks.
 * It intentionally uses only Node's standard library so it can be deployed on
 * a small Node host without a package installation step.
 */

const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const querystring = require('node:querystring');

const PORT = Number(process.env.PORT || 8080);
const SECRET = process.env.VK_APP_SECRET || '';
const DATA_FILE = path.resolve(process.env.VK_CALLBACK_DATA || path.join(__dirname, 'data', 'orders.json'));

const PRODUCTS = Object.freeze({
  hints_3: { title: '3 подсказки', price: 3 },
  hints_10: { title: '10 подсказок', price: 7 },
  extra_error: { title: '+1 ошибка', price: 5 },
  extra_error_3: { title: '+3 ошибки', price: 12 },
  double_stars: { title: '×2 звёзды', price: 10 },
  remove_ads: { title: 'Без рекламы', price: 25 },
  skin_pack: { title: 'Все стили', price: 20 }
});

function readOrders() {
  try {
    const value = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return value && typeof value === 'object' ? value : {};
  } catch (error) {
    return {};
  }
}

function writeOrders(orders) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const temp = DATA_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(orders, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(temp, DATA_FILE);
}

function orderedSignatureInput(params) {
  return Object.keys(params)
    .filter((key) => key !== 'sig')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('');
}

function isValidSignature(params) {
  if (!SECRET || !params.sig) return false;
  const expected = crypto
    .createHash('md5')
    .update(orderedSignatureInput(params) + SECRET, 'utf8')
    .digest('hex');
  const actual = String(params.sig);
  if (!/^[a-f0-9]{32}$/i.test(actual)) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(actual, 'utf8'));
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(payload);
}

function vkError(code, message) {
  return { error: { error_code: code, error_msg: message } };
}

function handleCallback(params) {
  if (!SECRET) return { status: 500, body: vkError(10, 'VK_APP_SECRET is not configured') };
  if (!isValidSignature(params)) return { status: 403, body: vkError(10, 'Invalid signature') };

  const type = String(params.notification_type || '').toLowerCase();
  const isTest = type.endsWith('_test');
  const baseType = isTest ? type.slice(0, -5) : type;

  if (baseType === 'get_item') {
    const itemId = String(params.item || params.item_id || '');
    const product = PRODUCTS[itemId];
    if (!product) return { status: 200, body: vkError(20, 'Product does not exist') };
    return {
      status: 200,
      body: {
        response: {
          item_id: itemId,
          title: product.title,
          photo_url: 'https://puma04121990-blip.github.io/vk-arrows-puzzle/assets/menu-logo.png',
          price: product.price
        }
      }
    };
  }

  if (baseType === 'order_status_change') {
    const itemId = String(params.item || params.item_id || '');
    const product = PRODUCTS[itemId];
    const orderId = String(params.order_id || '');
    if (!product || !orderId) {
      return { status: 200, body: vkError(11, 'Invalid order data') };
    }

    const orders = readOrders();
    const key = `${isTest ? 'test:' : 'live:'}${orderId}`;
    const previous = orders[key];
    const appOrderId = previous && previous.app_order_id ? previous.app_order_id : String(Date.now());
    orders[key] = {
      order_id: orderId,
      app_order_id: appOrderId,
      item: itemId,
      price: product.price,
      user_id: String(params.user_id || ''),
      status: String(params.status || 'chargeable'),
      test: isTest,
      first_seen_at: previous ? previous.first_seen_at : new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    };
    writeOrders(orders);

    return {
      status: 200,
      body: {
        response: {
          order_id: Number(orderId) || orderId,
          app_order_id: Number(appOrderId) || appOrderId
        }
      }
    };
  }

  return { status: 200, body: vkError(11, `Unsupported notification_type: ${type}`) };
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  if (urlPath !== '/vk/payments') {
    return json(res, 404, { error: 'Not found' });
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return json(res, 200, {
      ok: true,
      configured: Boolean(SECRET),
      endpoint: '/vk/payments'
    });
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  let raw = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > 1024 * 1024) req.destroy();
  });
  req.on('end', () => {
    try {
      const contentType = String(req.headers['content-type'] || '');
      const params = contentType.includes('application/json') ? JSON.parse(raw) : querystring.parse(raw);
      const result = handleCallback(params || {});
      json(res, result.status, result.body);
    } catch (error) {
      console.error('[VK Payments] callback error:', error);
      json(res, 500, vkError(1, 'Internal callback error'));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[VK Payments] listening on http://0.0.0.0:${PORT}/vk/payments`);
  if (!SECRET) console.warn('[VK Payments] WARNING: set VK_APP_SECRET before production use');
});

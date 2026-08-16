# VK Payments callback

The static game calls `VKWebAppShowOrderBox` with the product `item` identifier. Real VK Payments also requires a public HTTPS callback URL configured in the VK application settings. This repository includes a dependency-free Node callback at `server/vk-payments-callback.js`.

## Local start

```bash
VK_APP_SECRET='your-app-secret' PORT=8080 node server/vk-payments-callback.js
```

Configure the VK application callback URL as:

```text
https://YOUR_PUBLIC_HOST/vk/payments
```

The callback accepts `POST` form data and handles `get_item` and `order_status_change`. It verifies the `sig` field, returns product metadata from the single source of truth in `PRODUCTS`, supports VK test-mode notification suffixes, and stores seen orders in `server/data/orders.json` using a `test:` or `live:` namespace so overlapping test and production order IDs do not collide.

## Production requirements

The callback must be deployed to a public HTTPS host, and `VK_APP_SECRET` must be stored as a server-side secret rather than committed to the repository. The process should be backed by persistent storage and monitored. The included JSON journal is suitable for a small single-process deployment; a multi-instance deployment should replace it with a transactional database table keyed by `(environment, order_id)`.

The frontend grants a product only after VK Bridge returns `status: "success"` (the legacy `success: true` shape is also accepted for compatibility). A cancel, unknown status, bridge error, or failed grant does not grant the product.

## Product identifiers

| Item ID | Price in VK Votes | Grant |
|---|---:|---|
| `hints_3` | 3 | Adds 3 hints |
| `hints_10` | 7 | Adds 10 hints |
| `extra_error` | 5 | Adds 1 permanent mistake slot |
| `extra_error_3` | 12 | Adds 3 permanent mistake slots |
| `double_stars` | 10 | Enables double stars for the next completed level |
| `remove_ads` | 25 | Permanently disables interstitial ads |
| `skin_pack` | 20 | Unlocks every non-free skin |

> The callback endpoint validates the item and price presented by its own product table. Do not accept client-provided prices.

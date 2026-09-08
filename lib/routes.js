// Screen id <-> real URL path, so Next.js routing replaces the prototype's
// internal `screen` state string. Ids match the keys used in lib/data.js.
export const PATHS = {
  login: '/login',
  signup: '/signup',
  forgot: '/forgot-password',
  reset: '/reset-password',

  dashboard: '/dashboard',

  orders: '/orders',
  b2c: '/orders/b2c',
  reverse: '/orders/reverse',
  dropship: '/orders/dropshipping',
  shipnow: '/orders/ship-now',

  ratecalc: '/tools/rate-calculator',
  ratecard: '/tools/rate-card',
  pincode: '/tools/pincode-serviceability',

  shipments: '/shipments',
  'ship-detail': '/shipments/detail',

  ndr: '/ndr',
  weight: '/weight-discrepancies',

  mis: '/mis',

  cod: '/finance/cod-reconciliation',
  charges: '/finance/shipping-charges',
  recharges: '/finance/recharges',
  wallet: '/finance/wallet-history',
  invoice: '/finance/invoice',

  whatsapp: '/marketing/whatsapp',
  email: '/marketing/email',

  amazon: '/channels/amazon',
  shopify: '/channels/shopify',
  woo: '/channels/woocommerce',
  opencart: '/channels/opencart',
  magento: '/channels/magento',

  'wa-api': '/integrations/whatsapp-api',
  'sms-api': '/integrations/sms-api',

  warehouse: '/settings/warehouse',
  'account-config': '/settings/account-configuration',
  kyc: '/settings/kyc',
  'courier-rules': '/settings/courier-rules',
  label: '/settings/label',
  'inv-settings': '/settings/invoice-settings',
  printer: '/settings/printer',
  webhook: '/settings/webhook',
  notifications: '/settings/notifications',
  profile: '/settings/profile',
  password: '/settings/change-password',

  'a-overview': '/admin/overview',
  'a-sellers': '/admin/sellers',
  'a-shipments': '/admin/shipments',
  'a-couriers': '/admin/couriers',
  'a-ndr': '/admin/ndr',
  'a-cod': '/admin/cod',
  'a-jobs': '/admin/jobs',
};

export const IDS_BY_PATH = Object.fromEntries(Object.entries(PATHS).map(([id, path]) => [path, id]));

export function pathFor(id) {
  return PATHS[id] || '/dashboard';
}

export function idForPath(pathname) {
  return IDS_BY_PATH[pathname] || 'dashboard';
}

/**
 * Environment configuration - loaded from .env.{int|uat} files
 */
export const ENV = {
  // Frontend URLs (port 8010)
  BASE_URL: process.env.BASE_URL || 'https://iwmsint.corp.ivcinc.com:8010',
  WEB_LOGIN_URL: process.env.WEB_LOGIN_URL || 'https://iwmsint.corp.ivcinc.com:8010/FLogin.html',
  RF_LOGIN_URL: process.env.RF_LOGIN_URL || 'https://iwmsint.corp.ivcinc.com:8010/MobileApp/index.html#/login',
  RF_BASE_URL: process.env.RF_BASE_URL || 'https://iwmsint.corp.ivcinc.com:8010/MobileApp',

  // Backend API URL (port 8012, smis-api gateway)
  API_BASE_URL: process.env.API_BASE_URL || 'https://iwmsint.corp.ivcinc.com:8012/smis-api',

  // Accounts
  ADMIN_USER: process.env.ADMIN_USER || 'fei.fu.aland',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  ADMIN_USE_RADIUS: process.env.ADMIN_USE_RADIUS === 'true',

  TEST_USER: process.env.TEST_USER || 'Test',
  TEST_PASSWORD: process.env.TEST_PASSWORD || 'Test',
  TEST_USE_RADIUS: process.env.TEST_USE_RADIUS === 'true',

  // Organization
  DEFAULT_ORG: process.env.DEFAULT_ORG || 'AND',
  DEFAULT_WAREHOUSE: process.env.DEFAULT_WAREHOUSE || 'AND',

  // Database
  DB_HOST: process.env.DB_HOST || 'iwmsintdb01.corp.ivcinc.com',
  DB_PORT: parseInt(process.env.DB_PORT || '1521'),
  DB_SERVICE: process.env.DB_SERVICE || 'IWMSINT.corp.ivcinc.com',
  DB_USER: process.env.DB_USER || 'WMS',
  DB_PASSWORD: process.env.DB_PASSWORD || 'WMS',
  DB_RO_USER: process.env.DB_RO_USER || 'xxwms_ro',
  DB_RO_PASSWORD: process.env.DB_RO_PASSWORD || 'xxwms_ro',

  // API Paths (relative to API_BASE_URL)
  API: {
    LOGIN: process.env.API_LOGIN || '/WServiceInterface/LoginUser',
    SERVICE: process.env.API_SERVICE || '/WServiceInterface',
    PURCHASE: process.env.API_PURCHASE || '/WSIPurchase',
    GOODS: process.env.API_GOODS || '/WSIGoods',
    INVENTORY: process.env.API_INVENTORY || '/WSIInventory',
    WMSSHOP: process.env.API_WMSSHOP || '/WSIWMSShop',
    COMMON: process.env.API_COMMON || '/WSICommon',
    QMS: process.env.API_QMS || '/WSIQMS',
    MOBILE: process.env.API_MOBILE || '/ServiceMobileApp',
  },

  // Timeouts
  DEFAULT_TIMEOUT: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
  NAVIGATION_TIMEOUT: parseInt(process.env.NAVIGATION_TIMEOUT || '60000'),
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000'),
};

/**
 * Organization configs
 */
export const ORGS = {
  AND: { code: 'AND', name: 'AND', type: 'DC', description: 'Distribution Center' },
  DDR: { code: 'DDR', name: 'DDR', type: 'Factory', description: 'Factory Warehouse' },
  WOD: { code: 'WOD', name: 'WOD', type: 'Factory', description: 'Factory Warehouse' },
  '89_Retains': { code: '89_Retains', name: '89_Retains', type: 'Retains', description: 'Retained Samples' },
} as const;

export type OrgCode = keyof typeof ORGS;

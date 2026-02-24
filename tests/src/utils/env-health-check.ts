/**
 * Environment health check - verify web and API endpoints
 * Run with: npm run env:check
 * Switch env: set TEST_ENV=uat && npm run env:check
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import https from 'https';
import { URL } from 'url';

// Load env file based on TEST_ENV
const env = process.env.TEST_ENV || 'int';
dotenv.config({ path: path.resolve(__dirname, '../../', `.env.${env}`) });

// Now import ENV (after dotenv loaded)
import { ENV } from '../config/env';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function httpGet(name: string, url: string): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const timeout = setTimeout(() => { if (!done) { done = true; console.log(`   ❌ ${name}: timeout`); resolve(false); } }, 10000);
    https.get(url, (res) => {
      if (done) return;
      done = true; clearTimeout(timeout);
      console.log(`   ✅ ${name}: ${res.statusCode} ${res.statusMessage}`);
      res.resume();
      resolve(true);
    }).on('error', (err) => {
      if (done) return;
      done = true; clearTimeout(timeout);
      console.log(`   ❌ ${name}: ${err.message}`);
      resolve(false);
    });
  });
}

function httpPost(name: string, url: string, body: object): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const timeout = setTimeout(() => { if (!done) { done = true; console.log(`   ❌ ${name}: timeout`); resolve(false); } }, 10000);
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: parsed.hostname,
      port: parsed.port || '443',
      path: parsed.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      if (done) return;
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (done) return;
        done = true; clearTimeout(timeout);
        const preview = responseData.substring(0, 120).replace(/[\n\r]/g, ' ');
        console.log(`   ✅ ${name}: ${res.statusCode} — ${preview}`);
        resolve(true);
      });
    });
    req.on('error', (err) => {
      if (done) return;
      done = true; clearTimeout(timeout);
      console.log(`   ❌ ${name}: ${err.message}`);
      resolve(false);
    });
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`🌐 IWMS ${env.toUpperCase()} Environment Health Check`);
  console.log('=====================================\n');
  console.log(`Frontend: ${ENV.BASE_URL}`);
  console.log(`Backend:  ${ENV.API_BASE_URL}\n`);

  console.log('1. Web pages (GET)...');
  await httpGet('Web Login', ENV.WEB_LOGIN_URL);
  await httpGet('RF Login', `${ENV.BASE_URL}/MobileApp/index.html`);

  console.log('\n2. API Login (POST)...');
  const loginPayload = {
    ActionName: 'LoginUser',
    UserCode: ENV.TEST_USER,
    Password: ENV.TEST_PASSWORD,
    UseRadius: false,
    Language: 'US',
  };
  await httpPost('Login API', `${ENV.API_BASE_URL}${ENV.API.LOGIN}`, loginPayload);

  console.log('\n3. API Endpoints (POST)...');
  const testPayload = { ActionName: 'Ping', UserCode: 'Test', OrgID: 'AND' };
  const endpoints = [
    { name: 'WServiceInterface', path: ENV.API.SERVICE },
    { name: 'Purchase', path: ENV.API.PURCHASE },
    { name: 'Goods', path: ENV.API.GOODS },
    { name: 'Inventory', path: ENV.API.INVENTORY },
    { name: 'Common', path: ENV.API.COMMON },
    { name: 'WMSShop', path: ENV.API.WMSSHOP },
    { name: 'MobileApp', path: ENV.API.MOBILE },
  ];
  for (const ep of endpoints) {
    await httpPost(ep.name, `${ENV.API_BASE_URL}${ep.path}`, testPayload);
  }

  console.log('\n✅ Environment check complete!');
}

main();

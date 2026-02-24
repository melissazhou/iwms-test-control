/**
 * Web Login Page Object (EasyUI FLogin.html)
 * 
 * Note: The Web login page DOM was not directly observed (admin was already logged in).
 * Selectors below are best-effort based on the RF login patterns and EasyUI conventions.
 * The FLogin.html likely has similar fields: UserCode, Password, UseRadius checkbox, Login button.
 * Will need refinement after observing actual login page DOM.
 */
import { Page, Locator, expect } from '@playwright/test';
import { ENV } from '../../config/env';

export class WebLoginPage {
  readonly page: Page;
  readonly userInput: Locator;
  readonly passwordInput: Locator;
  readonly useRadiusCheckbox: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Try multiple selector strategies
    this.userInput = page.locator('#txtUserCode, input[name="UserCode"], input[id*="UserCode"]').first();
    this.passwordInput = page.locator('#txtPassword, input[name="Password"], input[type="password"]').first();
    this.useRadiusCheckbox = page.locator('#chkRadius, input[name="UseRadius"], input[type="checkbox"]').first();
    this.loginButton = page.locator('#btnLogin, a:has-text("Login"), input[value="Login"], button:has-text("Login")').first();
  }

  async goto(): Promise<void> {
    await this.page.goto(ENV.WEB_LOGIN_URL, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async login(
    username: string = ENV.ADMIN_USER,
    password: string = ENV.ADMIN_PASSWORD,
    useRadius: boolean = ENV.ADMIN_USE_RADIUS
  ): Promise<void> {
    await this.goto();

    await this.userInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.userInput.clear();
    await this.userInput.fill(username);

    await this.passwordInput.clear();
    await this.passwordInput.fill(password);

    // Handle Use Radius
    const isChecked = await this.useRadiusCheckbox.isChecked().catch(() => false);
    if (useRadius && !isChecked) {
      await this.useRadiusCheckbox.check();
    } else if (!useRadius && isChecked) {
      await this.useRadiusCheckbox.uncheck();
    }

    await this.loginButton.click();

    // Wait for main page load
    await this.page.waitForURL('**/FStartPage**', { timeout: 30000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async loginAsAdmin(): Promise<void> {
    await this.login(ENV.ADMIN_USER, ENV.ADMIN_PASSWORD, true);
  }

  async loginAsTest(): Promise<void> {
    await this.login(ENV.TEST_USER, ENV.TEST_PASSWORD, false);
  }
}

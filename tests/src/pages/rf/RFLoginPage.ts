/**
 * RF MobileApp Login Page Object (Ionic/AngularJS)
 * 
 * Actual DOM structure observed:
 *   textbox "User Code"
 *   textbox "Password"
 *   combobox "Language" (English)
 *   button "Login"
 *   checkbox + "Use Radius"
 *   checkbox + "Auto login"
 *   combobox (Org: 89_Retains, WOD, AND, DDR)
 *   textbox (Forklift)
 */
import { Page, Locator } from '@playwright/test';
import { ENV } from '../../config/env';
import { waitForRFPage } from '../../utils/helpers';

export class RFLoginPage {
  readonly page: Page;

  // Selectors based on actual observed DOM
  readonly userInput: Locator;
  readonly passwordInput: Locator;
  readonly languageSelect: Locator;
  readonly loginButton: Locator;
  readonly useRadiusCheckbox: Locator;
  readonly autoLoginCheckbox: Locator;
  readonly orgSelect: Locator;
  readonly forkliftInput: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use accessible name selectors matching actual DOM
    this.userInput = page.getByRole('textbox', { name: 'User Code' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.languageSelect = page.getByRole('combobox', { name: 'Language' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    // Use Radius is the first checkbox, Auto login is the second
    this.useRadiusCheckbox = page.locator('ion-checkbox, input[type="checkbox"]').first();
    this.autoLoginCheckbox = page.locator('ion-checkbox, input[type="checkbox"]').nth(1);
    // Org selector - combobox near "Org：" text
    this.orgSelect = page.locator('select').last();
    this.forkliftInput = page.getByRole('textbox').nth(2);
  }

  async goto(): Promise<void> {
    await this.page.goto(ENV.RF_LOGIN_URL, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(2000); // Wait for Angular bootstrap
  }

  async login(
    username: string = ENV.TEST_USER,
    password: string = ENV.TEST_PASSWORD,
    useRadius: boolean = ENV.TEST_USE_RADIUS,
    org?: string
  ): Promise<void> {
    await this.goto();

    // Fill credentials
    await this.userInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.userInput.click();
    await this.userInput.fill(username);

    await this.passwordInput.click();
    await this.passwordInput.fill(password);

    // Handle Use Radius checkbox
    const isChecked = await this.useRadiusCheckbox.isChecked().catch(() => false);
    if (useRadius && !isChecked) {
      await this.useRadiusCheckbox.click();
    } else if (!useRadius && isChecked) {
      await this.useRadiusCheckbox.click();
    }

    // Select org if specified
    if (org) {
      await this.orgSelect.selectOption({ label: org });
    }

    // Click login
    await this.loginButton.click();

    // Wait for navigation to main menu or org selection
    await this.page.waitForTimeout(3000);
    await waitForRFPage(this.page);
  }

  async loginAsTest(org?: string): Promise<void> {
    await this.login(ENV.TEST_USER, ENV.TEST_PASSWORD, false, org);
  }

  async loginAsAdmin(org?: string): Promise<void> {
    await this.login(ENV.ADMIN_USER, ENV.ADMIN_PASSWORD, true, org);
  }
}

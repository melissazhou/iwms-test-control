/**
 * Web Main Page Object (FStartPage.html)
 * 
 * Actual DOM structure observed:
 * - Top bar: "i-WMS UAT", Resp combobox, ORG combobox, Set Default, user link
 * - Left sidebar: menu search textbox + list of menu categories (links)
 *   - "System And Authority Management"
 *   - "Setup"
 *   - "Labels Reports"
 *   - "PO Module"
 *   - "Inventory Module"
 *   - "Manufacturing Module"
 *   - "Product Sales Module" → sub-items:
 *     - "SO DashBoard", "DNShippingStatusMonitor", "QueryDNMonitor", "CompleteLoad Report"
 *     - "Sales Order Maint." (SO release/management page)
 *     - "Create Wave", "Add Wave Detail", "Allocation Query"
 *     - "To Be Printed Sales Returns Query", "Sales Return Note"
 *     - "SO Picked List", "SO Packed List"
 *     - "To Print Shpg. Notice Query", "Sales out receipt"
 *     - "Sales Dely. Order (Source Notice)", "Sales delivery memo"
 *     - "Shpg. Schedule Inquiry"
 *   - "Configuration"
 *   - "Integrated System Integration"
 *   - "Statistical Report"
 * - Right content area: tabs (listitem) + iframe per tab
 * - Content pages load inside iframes
 */
import { Page, Locator, FrameLocator } from '@playwright/test';

export class WebMainPage {
  readonly page: Page;

  // Top bar
  readonly respSelect: Locator;
  readonly orgSelect: Locator;

  // Menu
  readonly menuSearch: Locator;
  readonly menuList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.respSelect = page.locator('select').first(); // Resp combobox
    this.orgSelect = page.locator('select').nth(1);   // ORG combobox
    this.menuSearch = page.getByPlaceholder('Please query menu');
    this.menuList = page.locator('ul > li > a'); // Menu links in sidebar
  }

  /**
   * Click a top-level menu category to expand it
   */
  async expandMenu(menuName: string): Promise<void> {
    const menuLink = this.page.locator('a').filter({ hasText: menuName }).first();
    await menuLink.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click a submenu item (must expand parent first)
   */
  async clickMenuItem(menuName: string): Promise<void> {
    const menuLink = this.page.locator('a').filter({ hasText: menuName }).first();
    await menuLink.click();
    await this.page.waitForTimeout(1000);
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /**
   * Navigate to a menu by expanding parent then clicking child
   */
  async navigateToMenu(menuPath: string[]): Promise<void> {
    if (menuPath.length === 1) {
      await this.clickMenuItem(menuPath[0]);
    } else {
      // Expand parent
      await this.expandMenu(menuPath[0]);
      // Click child
      await this.clickMenuItem(menuPath[menuPath.length - 1]);
    }
  }

  /**
   * Switch organization via top bar
   */
  async switchOrg(orgCode: string): Promise<void> {
    await this.orgSelect.selectOption({ label: orgCode });
    await this.page.waitForTimeout(1000);
  }

  /**
   * Switch responsibility via top bar
   */
  async switchResp(respName: string): Promise<void> {
    await this.respSelect.selectOption({ label: respName });
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get the active content iframe
   * EasyUI loads each tab's content in a separate iframe
   */
  getActiveFrame(): FrameLocator {
    // The last iframe in the tabs area is the active one
    return this.page.frameLocator('iframe').last();
  }

  /**
   * Switch to a specific tab by clicking tab header
   */
  async switchTab(tabName: string): Promise<void> {
    const tab = this.page.locator('li').filter({ hasText: tabName }).first();
    await tab.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Close a tab by clicking its close icon
   */
  async closeTab(tabName: string): Promise<void> {
    const tab = this.page.locator('li').filter({ hasText: tabName });
    const closeIcon = tab.locator('img, .tabs-close');
    await closeIcon.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Search for a menu item using the search box
   */
  async searchMenu(query: string): Promise<void> {
    await this.menuSearch.clear();
    await this.menuSearch.fill(query);
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if on main page
   */
  async isMainPage(): Promise<boolean> {
    return this.page.url().includes('FStartPage') || this.page.url().includes('FMainMP');
  }
}

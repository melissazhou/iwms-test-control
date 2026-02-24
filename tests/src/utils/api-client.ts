/**
 * IWMS API Client - Direct HTTP calls to WMS backend
 * Backend is at port 8012 with /smis-api/ prefix
 * Uses JWT token for authentication
 */
import { request, APIRequestContext } from '@playwright/test';
import { ENV } from '../config/env';

export interface LoginInfo {
  UserCode: string;
  OrgID: string;
  Warehouse: string;
  Language: string;
  Token?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  errorCode?: string;
}

export class IWMSApiClient {
  private context: APIRequestContext | null = null;
  private loginInfo: LoginInfo;
  private jwtToken: string = '';

  constructor(loginInfo?: Partial<LoginInfo>) {
    this.loginInfo = {
      UserCode: loginInfo?.UserCode || ENV.TEST_USER,
      OrgID: loginInfo?.OrgID || ENV.DEFAULT_ORG,
      Warehouse: loginInfo?.Warehouse || ENV.DEFAULT_WAREHOUSE,
      Language: loginInfo?.Language || 'US',
      ...loginInfo,
    };
  }

  async init(): Promise<void> {
    this.context = await request.newContext({
      baseURL: ENV.API_BASE_URL,
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
      },
    });
  }

  async dispose(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.jwtToken) {
      headers['authorization'] = this.jwtToken;
    }
    return headers;
  }

  /**
   * Login via IWMS API and get JWT token
   * Endpoint: POST /WServiceInterface/LoginUser
   */
  async login(userCode?: string, password?: string, useRadius = false): Promise<any> {
    const user = userCode || this.loginInfo.UserCode;
    const pass = password || (userCode === ENV.ADMIN_USER ? ENV.ADMIN_PASSWORD : ENV.TEST_PASSWORD);

    const payload = {
      ActionName: 'LoginUser',
      UserCode: user,
      Password: pass,
      UseRadius: useRadius,
      Language: 'US',
    };

    const response = await this.context!.post(ENV.API.LOGIN, {
      data: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    // Extract JWT token from response
    if (result.Token || result.token) {
      this.jwtToken = result.Token || result.token;
    }

    // Update loginInfo from response
    if (result.OrgID) this.loginInfo.OrgID = result.OrgID;
    if (result.UserCode) this.loginInfo.UserCode = result.UserCode;

    return result;
  }

  /**
   * Generic API call to WMS service endpoints
   * All endpoints are POST with JSON body
   */
  async callService(
    endpoint: string,
    actionName: string,
    data: Record<string, any> = {}
  ): Promise<any> {
    const payload = {
      ActionName: actionName,
      UserCode: this.loginInfo.UserCode,
      OrgID: this.loginInfo.OrgID,
      Warehouse: this.loginInfo.Warehouse || this.loginInfo.OrgID,
      Language: this.loginInfo.Language,
      ...data,
    };

    const response = await this.context!.post(endpoint, {
      data: JSON.stringify(payload),
      headers: this.getHeaders(),
      timeout: ENV.API_TIMEOUT,
    });

    return response.json();
  }

  // ---- Purchase APIs ----
  async purchaseAction(action: string, data: Record<string, any> = {}): Promise<any> {
    return this.callService(ENV.API.PURCHASE, action, data);
  }

  // ---- Goods/SO APIs ----
  async goodsAction(action: string, data: Record<string, any> = {}): Promise<any> {
    return this.callService(ENV.API.GOODS, action, data);
  }

  // ---- Inventory APIs ----
  async inventoryAction(action: string, data: Record<string, any> = {}): Promise<any> {
    return this.callService(ENV.API.INVENTORY, action, data);
  }

  // ---- WMS Shop (WO) APIs ----
  async shopAction(action: string, data: Record<string, any> = {}): Promise<any> {
    return this.callService(ENV.API.WMSSHOP, action, data);
  }

  // ---- Common APIs ----
  async commonAction(action: string, data: Record<string, any> = {}): Promise<any> {
    return this.callService(ENV.API.COMMON, action, data);
  }

  // ---- Mobile App APIs ----
  async mobileAction(action: string, data: Record<string, any> = {}): Promise<any> {
    return this.callService(ENV.API.MOBILE, action, data);
  }

  // ---- WServiceInterface generic ----
  async serviceAction(action: string, data: Record<string, any> = {}): Promise<any> {
    return this.callService(ENV.API.SERVICE, action, data);
  }

  // ============================================================
  // High-level helpers
  // ============================================================

  async getItems(orgCode?: string): Promise<any> {
    return this.commonAction('GetItems', { OrgID: orgCode || this.loginInfo.OrgID });
  }

  async getSubInventories(orgCode?: string): Promise<any> {
    return this.commonAction('GetSubInventories', { OrgID: orgCode || this.loginInfo.OrgID });
  }

  async getOnhand(itemCode: string, orgCode?: string): Promise<any> {
    return this.inventoryAction('QueryOnhand', {
      ItemCode: itemCode,
      OrgID: orgCode || this.loginInfo.OrgID,
    });
  }

  async queryDocs(docType: string, status?: string, orgCode?: string): Promise<any> {
    return this.commonAction('QueryDocBill', {
      DocType: docType,
      Status: status || 'OPEN',
      OrgID: orgCode || this.loginInfo.OrgID,
    });
  }
}

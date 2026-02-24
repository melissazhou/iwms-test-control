/**
 * RF Menu definitions mapped from routes.js
 * Each menu maps to: route path, page files, backend API endpoint, business class
 */

export interface MenuDef {
  id: string;
  name: string;
  module: string;
  route: string;
  apiEndpoint: string;
  description: string;
  hasCustom: boolean;
  priority: 'P0' | 'P1' | 'P2';
  orgs: string[]; // applicable organizations
}

// ========================
// SO / Sales / Shipping
// ========================
export const SO_MENUS: MenuDef[] = [
  // SO Picking
  { id: 'MENU_GoodsPickUp', name: 'SO Pick', module: 'goods', route: '/GoodsPickUp', apiEndpoint: '/WSIGoods', description: 'SO拣货', hasCustom: true, priority: 'P0', orgs: ['AND', 'DDR'] },
  { id: 'MENU_GoodsPickUpTrf', name: 'Pick Transfer', module: 'goods', route: '/GoodsPickUpTrf', apiEndpoint: '/WSIGoods', description: '拣货转移', hasCustom: true, priority: 'P0', orgs: ['AND', 'DDR'] },
  { id: 'MENU_GoodsPickUpbyFullpallet', name: 'Full Pallet Pick', module: 'goods', route: '/GoodsPickUpbyFullpallet', apiEndpoint: '/WSIGoods', description: '整托拣货', hasCustom: true, priority: 'P1', orgs: ['AND'] },
  
  // SO Delivery / Ship
  { id: 'MENU_GoodsDelivery', name: 'Ship Confirm', module: 'goods', route: '/GoodsDelivery', apiEndpoint: '/WSIGoods', description: '发货确认', hasCustom: false, priority: 'P0', orgs: ['AND', 'DDR'] },
  { id: 'MENU_GoodsDeliveryBySO', name: 'Ship by SO', module: 'goods', route: '/GoodsDeliveryBySO', apiEndpoint: '/WSIGoods', description: '按SO发货', hasCustom: true, priority: 'P0', orgs: ['AND', 'DDR'] },
  
  // SO Returns
  { id: 'MENU_GoodsBack', name: 'Return Receive', module: 'goods', route: '/GoodsBack', apiEndpoint: '/WSIGoods', description: '退货接收', hasCustom: false, priority: 'P1', orgs: ['AND', 'DDR'] },
  { id: 'MENU_GoodsPReturn', name: 'Return Process', module: 'goods', route: '/GoodsPReturn', apiEndpoint: '/WSIGoods', description: '退货处理', hasCustom: true, priority: 'P1', orgs: ['AND', 'DDR'] },
  { id: 'MENU_GoodsUnPickUp', name: 'Unpick', module: 'goods', route: '/GoodsUnPickUp', apiEndpoint: '/WSIGoods', description: '取消拣货', hasCustom: false, priority: 'P1', orgs: ['AND', 'DDR'] },
  { id: 'MENU_SalesOrderReturn', name: 'SO Return', module: 'inv', route: '/SalesOrderReturn', apiEndpoint: '/WSIGoods', description: 'SO退货', hasCustom: true, priority: 'P1', orgs: ['AND', 'DDR'] },
  
  // SO Load / Truck
  { id: 'MENU_SOLoad', name: 'SO Load', module: 'inv', route: '/SOLoad', apiEndpoint: '/WSIGoods', description: 'SO装车', hasCustom: true, priority: 'P0', orgs: ['AND'] },
  { id: 'MENU_SOLoadDelivery', name: 'SO Load Delivery', module: 'inv', route: '/SOLoadDelivery', apiEndpoint: '/WSIGoods', description: 'SO装车发运', hasCustom: false, priority: 'P0', orgs: ['AND'] },
  { id: 'MENU_SOLoadByScanSONew', name: 'Scan SO Load (New)', module: 'inv', route: '/SOLoadByScanSONew', apiEndpoint: '/WSIGoods', description: '扫SO装车(新)', hasCustom: true, priority: 'P1', orgs: ['AND'] },
  { id: 'MENU_LoadTruck', name: 'Load Truck', module: 'inv', route: '/LoadTruck', apiEndpoint: '/WSIGoods', description: '装车', hasCustom: true, priority: 'P1', orgs: ['AND'] },
  { id: 'MENU_UnloadTruck', name: 'Unload Truck', module: 'inv', route: '/UnloadTruck', apiEndpoint: '/WSIGoods', description: '卸车', hasCustom: true, priority: 'P1', orgs: ['AND'] },
  
  // Wave / Sorter
  { id: 'MENU_SorterPicking', name: 'Sorter Pick', module: 'inv', route: '/SorterPicking', apiEndpoint: '/WSIGoods', description: '分拣拣选', hasCustom: true, priority: 'P0', orgs: ['AND'] },
  { id: 'MENU_SorterPickingNew', name: 'Sorter Pick (New)', module: 'inv', route: '/SorterPickingNew', apiEndpoint: '/WSIGoods', description: '分拣拣选(新)', hasCustom: true, priority: 'P0', orgs: ['AND'] },
  { id: 'MENU_ForkliftToSorterBelt', name: 'Forklift to Sorter', module: 'goods', route: '/ForkliftToSorterBelt', apiEndpoint: '/WSIGoods', description: '叉车→分拣带', hasCustom: true, priority: 'P1', orgs: ['AND'] },
];

// ========================
// Purchase / Receiving
// ========================
export const PO_MENUS: MenuDef[] = [
  { id: 'MENU_poreceive', name: 'PO Receive', module: 'purchase', route: '/poreceive', apiEndpoint: '/WSIPurchase', description: 'PO收货', hasCustom: true, priority: 'P0', orgs: ['AND', 'DDR'] },
  { id: 'MENU_DCporeceive', name: 'DC PO Receive', module: 'purchase', route: '/DCporeceive', apiEndpoint: '/WSIPurchase', description: 'DC PO收货', hasCustom: true, priority: 'P0', orgs: ['AND'] },
  { id: 'MENU_receive', name: 'Receive', module: 'purchase', route: '/receive', apiEndpoint: '/WSIPurchase', description: '普通收货', hasCustom: false, priority: 'P1', orgs: ['AND', 'DDR'] },
  { id: 'MENU_poreceivecorrect', name: 'PO Receive Correct', module: 'purchase', route: '/poreceivecorrect', apiEndpoint: '/WSIPurchase', description: 'PO收货更正', hasCustom: true, priority: 'P1', orgs: ['AND', 'DDR'] },
  { id: 'MENU_reject', name: 'Reject', module: 'purchase', route: '/reject', apiEndpoint: '/WSIPurchase', description: '拒收', hasCustom: false, priority: 'P2', orgs: ['AND', 'DDR'] },
  { id: 'MENU_ReturnToVendor', name: 'Return to Vendor', module: 'purchase', route: '/ReturnToVendor', apiEndpoint: '/WSIPurchase', description: '退货给供应商', hasCustom: true, priority: 'P1', orgs: ['AND', 'DDR'] },
  { id: 'MENU_upshelf', name: 'Putaway', module: 'purchase', route: '/upshelf', apiEndpoint: '/WSIPurchase', description: '上架', hasCustom: false, priority: 'P0', orgs: ['AND', 'DDR'] },
  { id: 'MENU_UpShelfFull', name: 'Full Pallet Putaway', module: 'purchase', route: '/UpShelfFull', apiEndpoint: '/WSIPurchase', description: '整托上架', hasCustom: false, priority: 'P1', orgs: ['AND'] },
  { id: 'MENU_UpShelfLabel', name: 'Label Putaway', module: 'purchase', route: '/UpShelfLabel', apiEndpoint: '/WSIPurchase', description: '标签上架', hasCustom: true, priority: 'P1', orgs: ['AND', 'DDR'] },
];

// ========================
// Inventory Operations
// ========================
export const INV_MENUS: MenuDef[] = [
  { id: 'MENU_BinMove', name: 'Bin Move', module: 'inv', route: '/BinMove', apiEndpoint: '/WSIInventory', description: '储位移动', hasCustom: true, priority: 'P0', orgs: ['AND', 'DDR'] },
  { id: 'MENU_BinMoveLabel', name: 'Bin Move Label', module: 'inv', route: '/BinMoveLabel', apiEndpoint: '/WSIInventory', description: '标签储位移动', hasCustom: true, priority: 'P1', orgs: ['AND', 'DDR'] },
  { id: 'MENU_InvAdjust', name: 'Inv Adjust', module: 'inv', route: '/InvAdjust', apiEndpoint: '/WSIInventory', description: '库存调整', hasCustom: true, priority: 'P0', orgs: ['AND', 'DDR'] },
  { id: 'MENU_CycleCount', name: 'Cycle Count', module: 'inv', route: '/CycleCount', apiEndpoint: '/WSIInventory', description: '盘点', hasCustom: true, priority: 'P0', orgs: ['AND', 'DDR'] },
  { id: 'MENU_SubinvTrf', name: 'Subinv Transfer', module: 'inv', route: '/SubinvTrf', apiEndpoint: '/WSIInventory', description: '子库存转移', hasCustom: true, priority: 'P1', orgs: ['AND', 'DDR'] },
  { id: 'MENU_OrgTrf', name: 'Org Transfer', module: 'inv', route: '/OrgTrf', apiEndpoint: '/WSIInventory', description: '组织间转移', hasCustom: false, priority: 'P2', orgs: ['AND', 'DDR'] },
];

// ========================
// Work Order (WO/MO)
// ========================
export const WO_MENUS: MenuDef[] = [
  { id: 'MENU_MOIssue', name: 'MO Issue', module: 'inv', route: '/MOIssue', apiEndpoint: '/WSIWMSShop', description: '工单发料', hasCustom: true, priority: 'P0', orgs: ['DDR'] },
  { id: 'MENU_MOReturn', name: 'MO Return', module: 'inv', route: '/MOReturn', apiEndpoint: '/WSIWMSShop', description: '工单退料', hasCustom: true, priority: 'P1', orgs: ['DDR'] },
  { id: 'MENU_MOComplete', name: 'MO Complete', module: 'inv', route: '/MOComplete', apiEndpoint: '/WSIWMSShop', description: '完工入库', hasCustom: true, priority: 'P0', orgs: ['DDR'] },
  { id: 'MENU_MOPick', name: 'MO Pick', module: 'inv', route: '/MOPick', apiEndpoint: '/WSIWMSShop', description: '工单拣配', hasCustom: true, priority: 'P0', orgs: ['DDR'] },
];

// All menus combined
export const ALL_MENUS: MenuDef[] = [...SO_MENUS, ...PO_MENUS, ...INV_MENUS, ...WO_MENUS];

/**
 * Web module definitions (EasyUI pages)
 */
export interface WebModuleDef {
  id: string;
  name: string;
  path: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2';
}

export const WEB_MODULES: WebModuleDef[] = [
  // SO Related Web Pages
  { id: 'SORelease', name: 'SO Release', path: '/InvDispatch/', description: 'SO Release (Wave & Direct)', priority: 'P0' },
  { id: 'ShipConfirm', name: 'Ship Confirm', path: '/DocBill/', description: 'Web端发货确认', priority: 'P0' },
  { id: 'WaveRelease', name: 'Wave Release', path: '/InvDispatch/', description: 'Wave Release', priority: 'P0' },
  
  // Document Management
  { id: 'DocBill', name: 'Doc Bill', path: '/DocBill/', description: '单据管理', priority: 'P1' },
  { id: 'Trans', name: 'Transactions', path: '/Trans/', description: '交易记录查询', priority: 'P1' },
  
  // Reports
  { id: 'InvReport', name: 'Inv Report', path: '/InvReport/', description: '库存报表', priority: 'P1' },
  
  // Settings
  { id: 'InvSetting', name: 'Inv Setting', path: '/InvSetting/', description: '库存设置', priority: 'P2' },
  { id: 'SystemSetting', name: 'System Setting', path: '/SystemSetting/', description: '系统设置', priority: 'P2' },
  
  // Quality
  { id: 'Quality', name: 'Quality', path: '/Quality/', description: '质量管理', priority: 'P2' },
  
  // Labels
  { id: 'LabelPrint', name: 'Label Print', path: '/LabelPrint/', description: '标签打印', priority: 'P2' },
];

# DOM Observations - IWMS UAT

## RF MobileApp Architecture

### Framework
- Ionic v1 + AngularJS
- All 137 pages cached simultaneously in DOM (Ionic view caching)
- Navigation via `angular.element(document.body).injector().get('$state').go('MENU_xxx')`
- Direct URL access breaks Angular template rendering
- Bottom tabs: `.tab-item` (Home[0], Menu[1], Me[2])

### loginInfo (global JS object)
Keys: LanguageCode, CompanyId, UserCode, UserName, OrgID, UserGroup, BrowserType, WorkLocation, Token, CompanyID, OrgList, OrgCode, OrgName, UserEntity, **ModuleRights**, CurrentMenuCategory, ModuleCategory, ModuleCategoryDetail, CurrentMenuTitle, TransStyleList

### ModuleRights (menu items)
Each item: MENUCODE, MENUDESC, MDLCODE, PMENUCODE, MENUSEQ, MENUTYPE, VISIBILITY, FORMURL, MDLSEQ, BIZFUNCCODE, TRANSSTYCODE, VIEWVALUE, IsMenuFolder, IMAGEURL, MENUINFO

### RF Page Common Pattern
All RF transaction pages share similar structure:
- `InputData.BillNoTemp` — scan/type document number
- `InputData.BillNo` — actual resolved bill number
- `TransStyCode_SelectedItem` — transaction type selector
- Dynamic fields from `UIProfileQuery` via ng-repeat
- `$parent` scope contains all functions

### SO Pick Page (GoodsPickUp.html)
- State: `MENU_GoodsPickUp`
- Title: 销售出库 / Sale Out Of Storage
- Core ng-models:
  - `InputData.BillNoTemp` (placeholder: "Scan the document, or input and then click [Go]")
  - `InputData.BillNo`
  - `TransStyCode_SelectedItem` (select)
- Read-only display: Customer, Subinventory
- Dynamic fields: WorkOrder, Warehouse, TaskID, SO Number, Delivery Id, SO, LPN
- Scope functions: onBillKeyUp, checkBill, checkSku, checkSkuQty, appendSku, removeSku, preSubmitCheck, submitBill, clearUI, goBack, goHome, scanBarcode, loadFifoInfo
- Arrays: TransStyCode_Data, SkuList, FifoList, UIProfileQuery, ComboBoxData, FromInvCode_Data
- InputData keys (166+): BillNo, BillNoTemp, ErrorFlag, LPN, SO, DELIVERY_ID, WaveNo, SaleOrderNo, Warehouse, etc.

### Sorter Pick Page (SorterPickingNew.html)
- State: `MENU_SorterPickingNew`
- Same base structure as GoodsPickUp

### SO Load Page (SOLoad.html)
- State: MENU_SOLoad (or similar, needs verification)
- URL: page/inv/SOLoad.html?version=1

### PO Receive Page (poreceive.html)
- State: MENU_POReceive (needs verification)

## Web EasyUI
### Login Page (FLogin.html)
- Selectors: #txtUserCode, #txtPassword, #chkRadius, #btnLogin (needs verification)

### Main Page (FStartPage.html#)
- Left menu tree (accordion + tree)
- Right iframe for content pages
- Product Sales Module > SO DashBoard

### SO DashBoard (iframe)
- Search fields (order): SO(0), Delivery ID(1), SO STATUS(2, default "Booked"), Allocated Status(3), Delivery Status(4), Wave ID(5), Customer Name(6), Scheduled ship date(7), Pick Type(8), Ship Date Start(9), Ship Date End(10), IVC Internal Status(11)
- Toolbar: Printer combobox → print → **Release** → Un-Release → Backorder → Show All Columns
- Datagrid shows SO records

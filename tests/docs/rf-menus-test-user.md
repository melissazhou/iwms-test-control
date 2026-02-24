# Test User RF Menus (137 menus, AND org, UAT)

## Key Findings
- loginInfo has `ModuleRights` (not `MenuList`)
- Each menu: MENUCODE, MENUDESC, FORMURL, TRANSSTYCODE, BIZFUNCCODE
- Hash route: `#/tab/home` (not `#/main`)
- Bottom tabs: Home | Menu | Me
- Navigation via Angular `$state.go()` or direct URL

## SO / Sales Shipment
| MENUCODE | Description | Page URL |
|----------|-------------|----------|
| YUN_APP_销售出库 | Sale Out Of Storage (SO Pick) | page/goods/GoodsPickUp.html |
| APP_销售下架 | Sales Order Picking | page/goods/GoodsPickUpTrf.html |
| APP_GoodsPickUpbyFullpallet | Full Pallet Picking | page/goods/GoodsPickUpbyFullpallet.html |
| YUN_APP_销售出货 | Sales And Dispatch | page/goods/GoodsDelivery.html |
| YUN_APP_销售出货（扫SO) | Ship Confirm (by SO) | page/goods/GoodsDeliveryBySO.html |
| APP_分拣机拣货(新) | Sorter Picking | page/inv/SorterPickingNew.html |
| APP_分拣机拣货 | Sorter Picking(Old) | page/inv/SorterPicking.html |
| APP_SorterRepack | Sorter Repack | page/inv/SorterRepack.html |
| APP_波次拣货叉车 | Wave Replenishment Pick | page/goods/ForkliftToSorterBelt.html |
| APP_装车（销售出库） | Sales Order Loading | page/inv/SOLoad.html?version=1 |
| APP_装车发运 | SO Load Delivery | page/inv/SOLoadDelivery.html |
| APP_SOLoadBySacnSO | SO Loading(Scan SO) | page/inv/SOLoadByScanSONew.html?version=1 |
| SOLoadByScanSOOpt | SO Loading(Scan SO) New | page/inv/SOLoadByScanSOOpt.html?version=1 |
| APP_销售发运下门户 | SO UnLoading | page/inv/SOUnLoadDoor.html |
| APP_SO退货 | RMA Receiving | page/inv/SalesOrderReturn.html |
| APP_SO更正 | SO Return Correct | page/inv/CorrectSOReturn.html |
| PDA_SoUnPickRepack | SO Unpick Repack | page/inv/SoUnPickRepack.html |
| APP_销售退货 | Sales Return | page/goods/GoodsBack.html |

## PO / Receiving
| MENUCODE | Description | Page URL |
|----------|-------------|----------|
| YUN_APP_PO收货 | PO Receiving | page/purchase/poreceive.html |
| APP_DCPO收货 | DC PO Receiving | page/purchase/DCporeceive.html |
| YUN_APP_ASN接收 | Delivery Note Receive | page/purchase/receive.html |
| APP_ASN接收（按行） | Delivery Receipt (By Line) | page/purchase/ASNReceiveL.html |
| APP_ASN收货(行扫描校验) | ASN Receiving (Line Scan) | page/purchase/ASNReceiveLSku.html |
| YUN_APP_PO更正 | PO Receive Correct | page/purchase/poreceivecorrect.html |
| YUN_APP_采购退货 | Purchase Return | page/purchase/reject.html |
| YUN_APP_采购退至供应商 | Return to Vendor | page/purchase/ReturnToVendor.html |

## Putaway
| MENUCODE | Description | Page URL |
|----------|-------------|----------|
| YUN_APP_入库上架 | Warehousing And Shelving | page/purchase/upshelf.html |
| YUN_APP_入库上架_批量 | Put Into Storage (Batch) | page/purchase/UpShelfFull.html |
| APP_入库上架（标签） | Label Putaway | page/purchase/UpShelfLabel.html |
| YUN_APP_入库上架（待检） | Shelving (Wait for inspection) | page/purchase/UpShelfNoIQC.html |
| APP_标签上架 | Putaway | page/inv/POChagneInvLoc.html |
| APP_DC标签上架 | DC Putaway | page/inv/DCPOChagneInvLoc.html |

## Inventory Operations
| MENUCODE | Description | Page URL |
|----------|-------------|----------|
| APP_无单据调拨（Pick_Drop） | Bin Move | page/inv/BinMove.html |
| APP_更改库位 | Bin Move (Lot) | page/inv/ChagneInvLotNo.html?ShowRcvOrg=Y |
| BinMoveWIPSTAGWDD | Bin Move in WIPSTAGWDD | page/inv/BinMoveWIPSTAGWDD.html |
| APP_无单据库存调整 | Inventory Adjustment | page/inv/OtherNoDoc.html |
| APP_无单据库存调整（已有标签） | Inv Adjust-Existing LPN | page/inv/NoDocHaveLabels.html |
| APP_无单据库存调整（新标签） | Inv Adjust-NEW LPN | page/inv/NoDocNewLabels.html |
| YUN_APP_仓库盘点 | W.H Inventory | page/inv/InvMake.html |
| YUN_APP_盘点库位作业 | Cycle Count | page/inv/InvMakeCountInvLocation.html |
| APP_紧急盘点 | Urgent Count | page/inv/UrgenMakenCount.html |
| APP_普通库位盘点 | Normal Cycle Count | page/inv/NormalMakenCount.html |
| YUN_APP_一步调拨 | Pick Material (Transfer) | page/inv/InvTrf.html |
| YUN_APP_杂项入库 | Miscellaneous Receipt | page/inv/InvTrfOtherInBatch.html |
| YUN_APP_杂项出库 | Miscellaneous Issue | page/inv/InvTrfOtherOutBatch.html |
| APP_更改库存状态 | INV Status Change | page/inv/ChagneInvStatus.html |
| APP_更改批次 | Stock Dump (Batch) | page/inv/ChagneInvNewLot.html |
| APP_Restock | Restock | page/inv/Restock.html |
| APP_LoadTruck | Load To Truck | page/inv/LoadTruckPlus.html |
| APP_UnLoadTruck | UnLoad from Truck | page/inv/UnLoadTruckPlus.html |

## WO / Manufacturing
| MENUCODE | Description | Page URL |
|----------|-------------|----------|
| APP_工单发料 | Work Order Issue | page/inv/InvIssueMaterial.html |
| APP_工单退料 | Wip Return Material | page/inv/InvIssueMaterialReturn.html |
| APP_工单发料（无单据） | WIP Issue (printed) | page/inv/WIPIssue.html |
| APP_工单发料（扫MO-NoPrint） | WIP Issue (non-printed) | page/inv/WIPIssueNoPrint.html |
| APP_工单退料（扫MO） | WIP Return (printed) | page/inv/WIPReturn.html |
| APP_工单退料（扫MO-NoPrint） | WIP Return (non-printed) | page/inv/WIPReturnNoPrint.html |
| APP_工单发料（扫MO_批次） | WIP Issue for WOD | page/inv/WIPIssueLot.html |
| APP_工单退料（扫MO_批次） | WIP Return for WOD | page/inv/WIPReturnLot.html |
| APP_工单完工入库 | WO Completion | page/goods/InvGoodRcvIn.html |
| APP_工单完工入库打标签 | WO Completion (Print) | page/goods/InvGoodRcvInPrintSN.html |
| APP_工单完工入库（按单） | WO Completion (By Order) | page/goods/InvGoodRcvIn.html?AutoLoadSN=Y |
| APP_工单完工退回 | Return WO Completed | page/goods/GoodsPReturn.html |
| APP_工单拣料 | WO Pick (non-printed) | page/goods/InvGoodRcvPick.html |
| WOPickForMes | WO Pick For MES | page/inv/WOPickForMes.html |
| APP_拉式汇总发料 | Pull Aggregate Issue | page/inv/SumPickPull.html |

## Labels
| MENUCODE | Description | Page URL |
|----------|-------------|----------|
| APP_查看标签信息 | View Label Info | page/inv/LabelView.html |
| APP_标签信息修改 | LPN Status Control | page/inv/LabelChange.html |
| APP_标签打包 | Associate Parent LPN | page/inv/InvLabelPackage.html |
| APP_标签拆分 | Split LPN | page/inv/InvSplitSNLabel.html |
| APP_标签合并 | Merge LPN | page/inv/InvMergeSNLabel.html |
| APP_MergeLPN | Merge LPN | page/inv/MergeLPN.html |
| APP_REPRINT_LABEL | Reprint label | page/inv/LabelView.html?PrintFlag=Y |
| APP_Reprint | Reprint | page/inv/Reprint.html |

## Query
| MENUCODE | Description | Page URL |
|----------|-------------|----------|
| APP_在库量查询 | Onhand Query | templates/InvQuery.html |
| APP_LPNQuery | LPN Query | templates/LPNQuery.html |
| APP_查看物料信息 | Material Info | page/inv/LabelSNQuery.html |
| APP_出入库明细 | In/Out Details | page/purchase/InvInOutDtlQuery.html |
| APP_工单发料明细查询 | WO Issue Detail Query | page/inv/MOIssueMaterialDTL.html |

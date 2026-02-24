# IWMS Test Control Center

一个本地管理页面，用来把测试流程标准化：
- 切换环境（int/uat）
- 一键执行测试和检查命令
- 实时查看运行状态
- 查看完整日志
- 停止当前任务

## 启动

```bash
cd D:\Project\IWMSTEST
npm run dashboard:start
```

打开：`http://localhost:5077`

> 可自定义端口：
> `set DASHBOARD_PORT=5080 && npm run dashboard:start`

## 功能清单

### 1) 环境切换
- 读取项目根目录所有 `.env.*` 文件
- 切换后自动设置 `TEST_ENV`
- 后续所有任务使用该环境

### 2) 预置命令（免手敲）
- 环境检查（env:check）
- 数据库检查（db:check）
- Smoke 测试（全量/RF/Web/API）
- SO/PO/WO/库存主流程
- 数据准备（seed/cleanup）
- 打开报告

### 3) 自定义命令
- 可输入任意命令执行
- 仍自动带当前 `TEST_ENV`

### 4) 运行控制
- 单任务串行（避免并发冲突）
- 可手动停止当前任务

### 5) 日志与历史
- 每次运行生成独立日志文件
- 路径：`tools/dashboard/logs/*.log`（避免被 Playwright 清空）
- 页面可直接查看日志
- 保存最近 50 次历史（可在 `tools/dashboard/state.json` 调整）

## 设计说明（为什么这样做）

1. **环境可视化**：避免命令行里忘记 `set TEST_ENV=uat`。
2. **任务模板化**：减少重复手敲命令和参数错误。
3. **日志集中化**：不用到处找输出，失败定位更快。
4. **串行执行**：WMS测试数据常互相影响，默认串行最稳。
5. **最少依赖**：服务端只用 Node 内置模块，部署简单。

## 后续增强建议（第二阶段）

- 失败自动分类（selector错误/登录失败/API超时/DB连接）
- 报告摘要（通过率、失败用例Top N）
- 按环境保存独立历史视图
- WebSocket 实时推流日志（替代2秒轮询）
- 与Jenkins联动（触发job+回传构建状态）

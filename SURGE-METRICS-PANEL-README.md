# Surge Metrics Panel

这是本地 Surge iOS 面板模块，显示运行时间、Surge 内存和全部网络接口的累计上传、下载流量。

## 安装

1. 使用以下链接在 Surge iOS 中安装模块：

   `https://raw.githubusercontent.com/AWelook/surge-metrics-panel/main/Surge-Metrics-Panel.sgmodule`

2. 打开并启用 `Surge Metrics Panel` 模块。模块会从本仓库的 Raw 地址自动下载脚本，无需手动放置 JS 文件。
3. 模块通过 Surge 脚本环境内置的 `$httpAPI` 读取本机指标，无需配置或保存 API Key。
4. 进入策略组页面，轻点面板右上角刷新按钮。

## 前置条件

脚本通过 Surge 内置的 `$httpAPI` 桥接读取 `/v1/metrics`，不会向外部服务器发送指标，也不需要 HTTP API Key。当前 Surge iOS 测试版必须包含 `/v1/metrics` 端点。

## 说明

- `update_interval` 默认为 60 秒。自动刷新只会在策略组页面显示时触发。
- 流量是接口累计计数，并非“今天的流量”；Surge/系统重启后的归零行为以 `/v1/metrics` 实际输出为准。
- 该模块需要包含 `/v1/metrics` 的 Surge iOS TestFlight 版本。

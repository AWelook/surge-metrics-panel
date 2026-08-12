# Surge Metrics Panel

这是本地 Surge iOS 面板模块，显示运行时间、Surge 内存和全部网络接口的累计上传、下载流量。

## iOS 免 Key 版本（推荐）

安装链接：

`https://raw.githubusercontent.com/AWelook/surge-metrics-panel/main/Surge-Monitor-API.sgmodule`

该版本固定每 10 秒刷新，不需要填写 API Key。脚本通过 Surge 内置的 `$httpAPI` 读取 `/v1/metrics`，不会通过 `127.0.0.1:6171` 发起需要鉴权的外部 HTTP 请求。

旧参数版在 iOS 上可能因为模块参数没有被替换而造成连续未授权请求；请重新安装以上链接以升级。

## 安装

1. 使用以下 V4 链接在 Surge iOS 中安装模块：

   `https://raw.githubusercontent.com/AWelook/surge-metrics-panel/main/Surge-Metrics-Panel-V4.sgmodule`

2. 打开并启用 `Surge Metrics Panel` 模块。模块会从本仓库的 Raw 地址自动下载脚本，无需手动放置 JS 文件。
3. 模块通过 Surge 脚本环境内置的 `$httpAPI` 读取本机指标，无需配置或保存 API Key。
4. 进入策略组页面，轻点面板右上角刷新按钮。

## 前置条件

脚本通过 Surge 内置的 `$httpAPI` 桥接读取 `/v1/metrics`，不会向外部服务器发送指标，也不需要 HTTP API Key。当前 Surge iOS 测试版必须包含 `/v1/metrics` 端点。

## 说明

- V4 固定每 60 秒检查刷新，不使用模块参数表。自动刷新只会在策略组页面显示时触发。
- 流量是接口累计计数，并非“今天的流量”；Surge/系统重启后的归零行为以 `/v1/metrics` 实际输出为准。
- 该模块需要包含 `/v1/metrics` 的 Surge iOS TestFlight 版本。

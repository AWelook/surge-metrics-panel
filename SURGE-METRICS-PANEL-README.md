# Surge Metrics Panel

这是本地 Surge iOS 面板模块，显示运行时间、Surge 内存和全部网络接口的累计上传、下载流量。

## 安装

1. 使用以下链接在 Surge iOS 中安装模块：

   `https://raw.githubusercontent.com/AWelook/surge-metrics-panel/main/Surge-Metrics-Panel.sgmodule`

2. 打开并启用 `Surge Metrics Panel` 模块。模块会从本仓库的 Raw 地址自动下载脚本，无需手动放置 JS 文件。
3. 打开模块的“编辑参数”，仅在 `api_key` 中填入 HTTP API Key；不要把 Key 写进 JS 文件，也不要分享模块实例。
4. 进入策略组页面，轻点面板右上角刷新按钮。

## 前置条件

当前 iOS 配置必须启用本机 HTTP API，例如：

```ini
[General]
http-api = <API_KEY>@127.0.0.1:6171
http-api-tls = false
```

脚本只访问 `http://127.0.0.1:6171/v1/metrics`，不会把指标或 Key 发送到外部服务器。

## 说明

- `update_interval` 默认为 60 秒。自动刷新只会在策略组页面显示时触发。
- 流量是接口累计计数，并非“今天的流量”；Surge/系统重启后的归零行为以 `/v1/metrics` 实际输出为准。
- 该模块需要包含 `/v1/metrics` 的 Surge iOS TestFlight 版本。

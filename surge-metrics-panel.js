/*
 * Surge Metrics Panel
 *
 * This script reads the local iOS Surge HTTP API only. The API key is supplied
 * by the module argument table at runtime; do not add a key to this file.
 */

const METRICS_URL = "http://127.0.0.1:6171/v1/metrics";
const apiKey = String($argument || "").trim();

function formatBytes(value) {
  if (!isFinite(value)) return "未知";

  let bytes = Number(value);
  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = 0;

  while (bytes >= 1024 && index < units.length - 1) {
    bytes /= 1024;
    index += 1;
  }

  return bytes.toFixed(2) + " " + units[index];
}

function formatUptime(value) {
  if (!isFinite(value)) return "未知";

  let seconds = Math.floor(Number(value));
  const days = Math.floor(seconds / 86400);
  seconds -= days * 86400;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  const result = [];
  if (days > 0) result.push(days + "天");
  if (hours > 0 || days > 0) result.push(hours + "小时");
  if (minutes > 0 || hours > 0 || days > 0) result.push(minutes + "分钟");
  if (result.length === 0) result.push(seconds + "秒");
  return result.join(" ");
}

function parseMetrics(text) {
  const metrics = [];
  const metricPattern = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{([^}]*)\})?\s+([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?)$/;
  const labelPattern = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:\\.|[^"])*)"/g;

  String(text).split(/\r?\n/).forEach(function (rawLine) {
    const line = rawLine.trim();
    if (!line || line.charAt(0) === "#") return;

    const match = line.match(metricPattern);
    if (!match) return;

    const labels = {};
    let labelMatch;
    while ((labelMatch = labelPattern.exec(match[2] || "")) !== null) {
      labels[labelMatch[1]] = labelMatch[2]
        .replace(/\\\\/g, "\\")
        .replace(/\\"/g, '"');
    }

    metrics.push({ name: match[1], labels: labels, value: Number(match[3]) });
  });

  return metrics;
}

function findMetric(metrics, name) {
  return metrics.filter(function (metric) {
    return metric.name === name;
  });
}

function firstMetric(metrics, name) {
  const values = findMetric(metrics, name);
  return values.length ? values[0] : null;
}

function sumMetric(metrics, name) {
  return findMetric(metrics, name).reduce(function (total, metric) {
    return total + metric.value;
  }, 0);
}

function doneError(message) {
  $done({
    title: "⚡ Surge Monitor",
    content: message,
    style: "error"
  });
}

if (!apiKey) {
  doneError("未设置 API Key\n\n请在模块的“编辑参数”中填写当前 Surge HTTP API Key。");
} else {
  $httpClient.get({
    url: METRICS_URL,
    headers: {
      "Accept": "text/plain; version=0.0.4",
      "X-Key": apiKey
    }
  }, function (error, response, body) {
    if (error) {
      doneError("无法读取本机 Metrics\n\n" + String(error));
      return;
    }

    if (!response || response.status < 200 || response.status >= 300) {
      doneError("Metrics 请求失败\n\nHTTP " + (response ? response.status : "未知"));
      return;
    }

    if (!body) {
      doneError("Metrics 返回为空\n\n请确认 iOS Surge 已启用 HTTP API，并运行支持 /v1/metrics 的测试版。");
      return;
    }

    const metrics = parseMetrics(body);
    const buildInfo = firstMetric(metrics, "surge_build_info");
    const uptime = firstMetric(metrics, "surge_uptime_seconds");
    const memory = firstMetric(metrics, "surge_memory_bytes");
    const download = sumMetric(metrics, "surge_interface_in_bytes_total");
    const upload = sumMetric(metrics, "surge_interface_out_bytes_total");

    const labels = buildInfo ? buildInfo.labels : {};
    const version = labels.version || "未知版本";
    const build = labels.build || "未知";
    const system = labels.system || "iOS";

    $done({
      title: "⚡ Surge Monitor",
      content: [
        "内存占用：" + formatBytes(memory ? memory.value : NaN),
        "运行时间：" + formatUptime(uptime ? uptime.value : NaN),
        "↓ " + formatBytes(download) + "     ↑ " + formatBytes(upload),
        "Surge " + version + " · Build " + build + " · " + system
      ].join("\n\n"),
      style: "info"
    });
  });
}

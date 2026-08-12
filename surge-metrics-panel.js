/*
 * Surge Metrics Panel
 *
 * This script reads the local iOS Surge HTTP API through Surge's built-in
 * $httpAPI bridge. Local script calls do not require an HTTP API key.
 */

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

function metricsText(result) {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  if (typeof result.body === "string") return result.body;
  if (typeof result.data === "string") return result.data;
  if (typeof result.result === "string") return result.result;
  return "";
}

$httpAPI("GET", "/v1/metrics", null, function (result) {
    const body = metricsText(result);

    if (!body) {
      const detail = result && result.error ? "\n\n" + String(result.error) : "";
      doneError("Metrics 返回为空\n\n请确认当前 Surge iOS 测试版支持 /v1/metrics。" + detail);
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

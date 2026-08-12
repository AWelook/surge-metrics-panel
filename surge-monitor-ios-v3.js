/*
 * Surge Monitor iOS
 *
 * Uses Surge's documented /v1/traffic API through the built-in $httpAPI
 * bridge. No external HTTP API key is required.
 */

function isFiniteNumber(value) {
    return isFinite(Number(value));
}

function formatBytes(value) {
    if (!isFiniteNumber(value)) {
        return "—";
    }

    let bytes = Math.max(0, Number(value));
    const units = ["B", "KB", "MB", "GB", "TB"];
    let unitIndex = 0;

    while (bytes >= 1024 && unitIndex < units.length - 1) {
        bytes /= 1024;
        unitIndex++;
    }

    return bytes.toFixed(2) + " " + units[unitIndex];
}

function formatSpeed(value) {
    const formatted = formatBytes(value);
    return formatted === "—" ? formatted : formatted + "/s";
}

function formatUptime(startTime) {
    if (!isFiniteNumber(startTime)) {
        return "—";
    }

    let seconds = Math.max(
        0,
        Math.floor((Date.now() - Number(startTime) * 1000) / 1000)
    );
    const days = Math.floor(seconds / 86400);
    seconds -= days * 86400;

    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;

    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    const parts = [];
    if (days > 0) {
        parts.push(days + "天");
    }
    if (hours > 0 || days > 0) {
        parts.push(hours + "小时");
    }
    if (minutes > 0 || hours > 0 || days > 0) {
        parts.push(minutes + "分钟");
    }
    if (parts.length === 0) {
        parts.push(seconds + "秒");
    }

    return parts.join(" ");
}

function sumInterfaces(interfaces) {
    const totals = {
        download: 0,
        upload: 0,
        downloadSpeed: 0,
        uploadSpeed: 0,
        found: false
    };

    if (!interfaces || typeof interfaces !== "object") {
        return totals;
    }

    Object.keys(interfaces).forEach(function (name) {
        if (name === "lo0") {
            return;
        }

        const item = interfaces[name];
        if (!item || typeof item !== "object") {
            return;
        }

        if (isFiniteNumber(item.in)) {
            totals.download += Number(item.in);
            totals.found = true;
        }
        if (isFiniteNumber(item.out)) {
            totals.upload += Number(item.out);
            totals.found = true;
        }
        if (isFiniteNumber(item.inCurrentSpeed)) {
            totals.downloadSpeed += Number(item.inCurrentSpeed);
        }
        if (isFiniteNumber(item.outCurrentSpeed)) {
            totals.uploadSpeed += Number(item.outCurrentSpeed);
        }
    });

    return totals;
}

function finishPanel(title, content, style, icon, iconColor) {
    const result = {
        title: title,
        content: content
    };

    if (style) {
        result.style = style;
    }
    if (icon) {
        result.icon = icon;
    }
    if (iconColor) {
        result["icon-color"] = iconColor;
    }

    $done(result);
}

$httpAPI("GET", "/v1/traffic", null, function (traffic) {
    if (!traffic || typeof traffic !== "object") {
        finishPanel(
            "Surge Monitor",
            "无法读取流量信息\n\n/v1/traffic 返回为空。",
            "error",
            "exclamationmark.triangle.fill",
            "#FF3B30"
        );
        return;
    }

    const totals = sumInterfaces(traffic.interface);
    if (!totals.found) {
        finishPanel(
            "Surge Monitor",
            "暂未取得网络接口数据\n\n请稍后轻点刷新。",
            "error",
            "exclamationmark.triangle.fill",
            "#FF9500"
        );
        return;
    }

    const environment = typeof $environment === "object"
        ? $environment
        : {};
    const version = environment["surge-version"] || "未知版本";
    const build = environment["surge-build"] || "未知";
    const system = environment.system || "iOS";

    const content = [
        "运行时间：  " + formatUptime(traffic.startTime),
        "",
        "累计流量：  ↓ " + formatBytes(totals.download) +
            "     ↑ " + formatBytes(totals.upload),
        "",
        "当前速度：  ↓ " + formatSpeed(totals.downloadSpeed) +
            "     ↑ " + formatSpeed(totals.uploadSpeed),
        "",
        "Surge " + version + " · Build " + build + " · " + system
    ].join("\n");

    finishPanel(
        "Surge Monitor",
        content,
        null,
        "chart.bar.xaxis",
        "#4A90E2"
    );
});

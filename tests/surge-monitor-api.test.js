const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const scriptPath = path.join(repoRoot, "surge-monitor-api.js");
const modulePath = path.join(repoRoot, "Surge-Monitor-API.sgmodule");
const scriptSource = fs.readFileSync(scriptPath, "utf8");
const moduleSource = fs.readFileSync(modulePath, "utf8");

function runScript(argument, httpResult) {
    let request;
    let result;

    const sandbox = {
        $argument: argument,
        $done: function (value) {
            result = value;
        },
        $httpClient: {
            get: function (options, callback) {
                request = options;
                callback(
                    httpResult.error || null,
                    httpResult.response || null,
                    httpResult.body || ""
                );
            }
        }
    };

    vm.runInNewContext(scriptSource, sandbox, { filename: scriptPath });
    return { request: request, result: result };
}

assert.match(moduleSource, /#!arguments=API_KEY=&update_interval=10/);
assert.match(moduleSource, /argument="%API_KEY%"/);
assert.match(moduleSource, /update-interval=%update_interval%/);

const missingKey = runScript("", {});
assert.equal(missingKey.request, undefined);
assert.equal(missingKey.result.style, "error");
assert.match(missingKey.result.content, /未设置 API Key/);

const metrics = [
    'surge_build_info{version="6.9.0",build="12040",system="iOS"} 1',
    "surge_uptime_seconds 3661",
    "surge_memory_bytes 1048576",
    'surge_interface_in_bytes_total{interface="en0"} 2048',
    'surge_interface_in_bytes_total{interface="pdp_ip0"} 1024',
    'surge_interface_out_bytes_total{interface="en0"} 4096'
].join("\n");

const success = runScript("secret-key", {
    response: { status: 200 },
    body: metrics
});
assert.equal(success.request.url, "http://127.0.0.1:6171/v1/metrics");
assert.equal(success.request.headers["X-Key"], "secret-key");
assert.match(success.result.content, /内存占用：  1\.00 MB/);
assert.match(success.result.content, /运行时间：  1小时 1分钟/);
assert.match(success.result.content, /↓ 3\.00 KB\s+↑ 4\.00 KB/);
assert.match(success.result.content, /Surge 6\.9\.0 · Build 12040 · iOS/);

const forbidden = runScript("wrong-key", {
    response: { status: 403 },
    body: "Forbidden"
});
assert.equal(forbidden.result.style, "error");
assert.match(forbidden.result.content, /HTTP 403/);
assert.match(forbidden.result.content, /请检查模块中的 API Key/);

console.log("surge-monitor-api: all tests passed");

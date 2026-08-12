const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const scriptPath = path.join(repoRoot, "surge-monitor-api.js");
const modulePath = path.join(repoRoot, "Surge-Monitor-API.sgmodule");
const scriptSource = fs.readFileSync(scriptPath, "utf8");
const moduleSource = fs.readFileSync(modulePath, "utf8");

function runScript(httpResult) {
    let request;
    let result;

    const sandbox = {
        $done: function (value) {
            result = value;
        },
        $httpAPI: function (method, apiPath, body, callback) {
            request = { method: method, path: apiPath, body: body };
            callback(httpResult);
        }
    };

    vm.runInNewContext(scriptSource, sandbox, { filename: scriptPath });
    return { request: request, result: result };
}

assert.doesNotMatch(moduleSource, /#!arguments|%API_KEY%|argument=/);
assert.match(moduleSource, /update-interval=10/);
assert.match(moduleSource, /surge-monitor-api\.js\?v=2/);

const metrics = [
    'surge_build_info{version="6.9.0",build="12040",system="iOS"} 1',
    "surge_uptime_seconds 3661",
    "surge_memory_bytes 1048576",
    'surge_interface_in_bytes_total{interface="en0"} 2048',
    'surge_interface_in_bytes_total{interface="pdp_ip0"} 1024',
    'surge_interface_out_bytes_total{interface="en0"} 4096'
].join("\n");

const success = runScript({
    body: metrics
});
assert.deepEqual(success.request, {
    method: "GET",
    path: "/v1/metrics",
    body: null
});
assert.match(success.result.content, /内存占用：  1\.00 MB/);
assert.match(success.result.content, /运行时间：  1小时 1分钟/);
assert.match(success.result.content, /↓ 3\.00 KB\s+↑ 4\.00 KB/);
assert.match(success.result.content, /Surge 6\.9\.0 · Build 12040 · iOS/);

const empty = runScript({
    error: "endpoint unavailable"
});
assert.equal(empty.result.style, "error");
assert.match(empty.result.content, /Metrics 返回为空/);
assert.match(empty.result.content, /endpoint unavailable/);

console.log("surge-monitor-api: all tests passed");

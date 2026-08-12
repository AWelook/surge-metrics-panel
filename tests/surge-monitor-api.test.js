const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const scriptPath = path.join(repoRoot, "surge-monitor-api.js");
const modulePath = path.join(repoRoot, "Surge-Monitor-API.sgmodule");
const scriptSource = fs.readFileSync(scriptPath, "utf8");
const moduleSource = fs.readFileSync(modulePath, "utf8");

function runScript(apiResult, environment) {
    let request;
    let result;

    const sandbox = {
        $environment: environment || {},
        $done: function (value) {
            result = value;
        },
        $httpAPI: function (method, apiPath, body, callback) {
            request = { method: method, path: apiPath, body: body };
            callback(apiResult);
        }
    };

    vm.runInNewContext(scriptSource, sandbox, { filename: scriptPath });
    return { request: request, result: result };
}

assert.doesNotMatch(moduleSource, /#!arguments|%API_KEY%|argument=/);
assert.match(moduleSource, /update-interval=10/);
assert.match(moduleSource, /surge-monitor-api\.js\?v=3/);

const startTime = Math.floor(Date.now() / 1000) - 3661;
const success = runScript(
    {
        startTime: startTime,
        interface: {
            lo0: {
                in: 999999,
                out: 999999,
                inCurrentSpeed: 999,
                outCurrentSpeed: 999
            },
            en0: {
                in: 2048,
                out: 4096,
                inCurrentSpeed: 512,
                outCurrentSpeed: 256
            },
            pdp_ip0: {
                in: 1024,
                out: 2048,
                inCurrentSpeed: 128,
                outCurrentSpeed: 64
            }
        }
    },
    {
        system: "iOS",
        "surge-version": "6.9.0",
        "surge-build": "12040"
    }
);

assert.deepEqual(success.request, {
    method: "GET",
    path: "/v1/traffic",
    body: null
});
assert.match(success.result.content, /运行时间：  1小时 1分钟/);
assert.match(success.result.content, /累计流量：  ↓ 3\.00 KB\s+↑ 6\.00 KB/);
assert.match(success.result.content, /当前速度：  ↓ 640\.00 B\/s\s+↑ 320\.00 B\/s/);
assert.match(success.result.content, /Surge 6\.9\.0 · Build 12040 · iOS/);
assert.doesNotMatch(success.result.content, /999999/);

const empty = runScript(null);
assert.equal(empty.result.style, "error");
assert.match(empty.result.content, /\/v1\/traffic 返回为空/);

const missingInterfaces = runScript({ startTime: startTime, interface: {} });
assert.equal(missingInterfaces.result.style, "error");
assert.match(missingInterfaces.result.content, /暂未取得网络接口数据/);

console.log("surge-monitor-api: all tests passed");

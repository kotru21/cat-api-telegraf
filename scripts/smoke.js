// Simple smoke test for health endpoints
import http from "http";

function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      const { statusCode } = res;
      res.resume();
      resolve(statusCode);
    });
    req.setTimeout(3000, () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", reject);
  });
}

const port = process.env.PORT || 5200;
const base = `http://localhost:${port}`;

(async () => {
  try {
    const h = await get(`${base}/healthz`);
    const r = await get(`${base}/readyz`);
    if (h === 200 && r === 200) {
      console.log("SMOKE_OK");
      process.exit(0);
    } else {
      console.error("SMOKE_FAIL", { h, r });
      process.exit(2);
    }
  } catch (e) {
    console.error("SMOKE_ERR", e.message);
    process.exit(3);
  }
})();

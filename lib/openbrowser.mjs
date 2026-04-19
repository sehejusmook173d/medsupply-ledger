/**
 * Runs `next dev` and opens the default browser when the dev server answers,
 * similar to Vite's server.open: `http://localhost:${port}`.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/** Returns true if we can bind to this TCP port (nothing else listening). */
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
}

/** First free port in [start, start + attempts). */
async function findAvailablePort(start, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    const p = start + i;
    if (await isPortFree(p)) return p;
  }
  throw new Error(
    `No free TCP port found in range ${start}–${start + attempts - 1}.`,
  );
}

const strictPort = process.env.PORT !== undefined && process.env.PORT !== "";
let port;

if (strictPort) {
  port = parseInt(process.env.PORT, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    process.exit(1);
  }
  if (!(await isPortFree(port))) {
        process.exit(1);
  }
} else {
  const preferred = 3000;
  port = await findAvailablePort(preferred);
  }

const url = `http://localhost:${port}`;
const portStr = String(port);

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "dev", "-p", portStr],
  {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, PORT: portStr },
  },
);

let opened = false;

async function openWhenReady() {
  for (let i = 0; i < 120; i++) {
    await delay(500);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.status < 500) {
        if (!opened && !process.env.CI && process.env.OPEN_BROWSER !== "0") {
          const open = (await import("open")).default;
          await open(url);
          opened = true;
        }
        return;
      }
    } catch {
      // server not ready yet
    }
  }
}

void openWhenReady();

const code = await new Promise((resolve) => {
  child.on("exit", (c, signal) => {
    resolve(signal ? 1 : (c ?? 0));
  });
  child.on("error", () => resolve(1));
});

process.exit(code);

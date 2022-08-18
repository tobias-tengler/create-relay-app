import { test, expect } from "@playwright/test";
import { ChildProcess, exec } from "child_process";
import { existsSync } from "fs";
import { runCmd } from "./helpers";

const TARGET_DIR = "./vite-js";
const PORT = 4002;
let webServerProcess: ChildProcess;

test.beforeAll(async () => {
  test.setTimeout(180000);

  if (!existsSync(TARGET_DIR)) {
    await runCmd(`yarn create vite vite-js --template react`);
  }

  await runCmd(
    `node ../../dist/bin.js --ignore-git-changes --package-manager yarn -y`,
    {
      cwd: TARGET_DIR,
    }
  );

  // todo: move testcomponent in

  await runCmd(`yarn --cwd ${TARGET_DIR} run relay`);

  await runCmd(`yarn --cwd ${TARGET_DIR} run build`);

  webServerProcess = exec(
    `yarn --cwd ${TARGET_DIR} run preview -- --port ${PORT}`,
    (error) => {
      if (error) {
        console.log("Failed to preview Vite app");
      }
    }
  );
});

test("Execute Vite/JS graphql request", async ({ page }) => {
  await page.route("**/graphql", async (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { field: "vite-js text" } }),
    });
  });

  await page.goto("http://localhost:" + PORT, { waitUntil: "networkidle" });

  const innerText = await page.locator("#test-data").innerText();

  await expect(innerText).toEqual("vite-js text");
});

test.afterAll(() => {
  webServerProcess?.kill();

  // if (existsSync(scaffoldDir)) {
  //   fs.rm(scaffoldDir, { recursive: true });
  // }
});

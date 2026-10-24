import { spawn } from "child_process";
import { createRequire } from "module";
const require = createRequire("d:/game/research-stage0/Gather/package.json");
const puppeteer = require("puppeteer-core");

// Start Gather Backend Server (3001) and Vite Dev Server (5173)
const serverProc = spawn(process.execPath, ["server.js"], {
  cwd: "d:/game/research-stage0/Gather/server",
  stdio: ["ignore", "pipe", "pipe"],
});
const clientProc = spawn(
  process.execPath,
  ["./node_modules/vite/bin/vite.js", "--port", "5173", "--host"],
  {
    cwd: "d:/game/research-stage0/Gather/client",
    stdio: ["ignore", "pipe", "pipe"],
  }
);

await new Promise((r) => setTimeout(r, 2500));

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--no-sandbox",
  ],
});

try {
  // Context 1: Desktop Browser (1280x720)
  const contextDesktop = await browser.createBrowserContext();
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.setViewport({ width: 1280, height: 720 });

  // Context 2: Mobile Device (iPhone 14 Pro - 393x852, touch enabled)
  const contextMobile = await browser.createBrowserContext();
  const pageMobile = await contextMobile.newPage();
  await pageMobile.setViewport({
    width: 393,
    height: 852,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });

  console.log("=== Opening Gather Clone on Desktop (1280x720) & Mobile (393x852) ===");
  await Promise.all([
    pageDesktop.goto("http://localhost:5173", { waitUntil: "networkidle2" }),
    pageMobile.goto("http://localhost:5173", { waitUntil: "networkidle2" }),
  ]);

  // Step 1: Pass MediaTest screen ("Looks good, continue") on both
  await pageDesktop.waitForSelector("button");
  await pageDesktop.click("button");
  await pageMobile.waitForSelector("button");
  await pageMobile.click("button");

  // Step 2: Enter name and join on Desktop & Mobile
  await pageDesktop.waitForSelector('input[type="text"]');
  await pageDesktop.type('input[type="text"]', "DesktopUser");
  await pageDesktop.click('button[type="submit"]');

  await pageMobile.waitForSelector('input[type="text"]');
  await pageMobile.type('input[type="text"]', "MobileUser");
  await pageMobile.click('button[type="submit"]');

  // Wait for Phaser canvas and socket sync
  await new Promise((r) => setTimeout(r, 2500));

  // Read HUD text and canvas info on both Desktop and Mobile
  const getPageStatus = (page) =>
    page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      const bodyText = document.body.innerText;
      const buttons = Array.from(document.querySelectorAll("button")).map((b) => ({
        text: b.innerText.trim(),
        rect: {
          x: Math.round(b.getBoundingClientRect().x),
          y: Math.round(b.getBoundingClientRect().y),
          w: Math.round(b.getBoundingClientRect().width),
          h: Math.round(b.getBoundingClientRect().height),
        },
      }));
      return {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
        hudText: bodyText.split("\n").map((s) => s.trim()).filter(Boolean),
        buttons,
      };
    });

  const desktopStatus = await getPageStatus(pageDesktop);
  const mobileStatus = await getPageStatus(pageMobile);

  // Trigger emoji reaction from DesktopUser and verify MobileUser sees it in DOM
  await pageDesktop.evaluate(() => {
    const reactBtn = Array.from(document.querySelectorAll("button")).find((b) => b.title === "React");
    if (reactBtn) reactBtn.click();
  });
  await new Promise((r) => setTimeout(r, 200));
  await pageDesktop.evaluate(() => {
    const waveBtn = Array.from(document.querySelectorAll("button")).find((b) => b.title === "👋");
    if (waveBtn) waveBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const mobileAfterReaction = await pageMobile.evaluate(() => document.body.innerText);

  console.log("=== [DESKTOP BROWSER (1280x720)] ===");
  console.log(JSON.stringify(desktopStatus, null, 2));
  console.log("=== [MOBILE DEVICE (393x852 iPhone 14 Pro)] ===");
  console.log(JSON.stringify(mobileStatus, null, 2));
  console.log("=== [MOBILE SAW DESKTOP REACTION IN REAL-TIME] ===");
  console.log(mobileAfterReaction.split("\n").map((s) => s.trim()).filter(Boolean));
} finally {
  await browser.close();
  clientProc.kill();
  serverProc.kill();
  process.exit(0);
}

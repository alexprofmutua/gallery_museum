/* global process, console, window, document, performance, requestAnimationFrame, PointerEvent, MouseEvent, URL */
// Run after npm run dev:personal. Writes private captures to the ignored local media folder.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out = new URL('../.local-museum/review/fidelity', import.meta.url).pathname;
await mkdir(out + '/after', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--mute-audio'] });
const report = { method: 'Headless installed Chrome; no forced software-renderer flags; 1280x800 CSS pixels; device scale 1; Medium; stationary after 30 warmup frames, 180 rAF frame intervals per view. Renderer identity is read from WebGL. All render passes counted, including reflections and shadows. Texture byte estimates exclude render-target/driver allocations.', rooms: [], errors: [] };
try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error')
        report.errors.push(msg.text()); });
    const started = Date.now();
    await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5175');
    await page.waitForFunction(() => document.querySelector('canvas')?.dataset.playerPosition, {}, { timeout: 60000 });
    report.startupToPlayerMs = Date.now() - started;
    await page.evaluate(async () => { const url = performance.getEntriesByType('resource').map(e => e.name).find(n => n.includes('/@react-three_fiber.js')); if (!url)
        throw Error('Fiber module URL missing'); const f = await import(url); const root = f._roots.get(document.querySelector('canvas')); if (!root)
        throw Error('Fiber root missing'); window.__auditStore = root.store; });
    await page.getByRole('button', { name: 'Enter the museum', exact: true }).click();
    async function move(z, key = "KeyW") {
        await page.evaluate(() => { window.__walk = { active: true, times: [], last: performance.now() }; const s = window.__walk; function tick(t) { if (!s.active)
            return; s.times.push(t - s.last); s.last = t; requestAnimationFrame(tick); } requestAnimationFrame(tick); });
        await page.keyboard.down('ShiftLeft');
        await page.keyboard.down(key);
        try {
            await page.waitForFunction(([t, k]) => { const z = JSON.parse(document.querySelector('canvas').dataset.playerPosition)[2]; return k === 'KeyW' ? z < t : z > t; }, [z, key], { timeout: 120000 });
        }
        finally {
            await page.keyboard.up(key);
            await page.keyboard.up('ShiftLeft');
        }
        const stats = await page.evaluate(() => { const s = window.__walk; s.active = false; s.times.sort((a, b) => a - b); const mean = s.times.reduce((a, b) => a + b, 0) / s.times.length; return { frames: s.times.length, meanMs: mean, p95Ms: s.times[Math.floor(s.times.length * .95)], maxMs: s.times.at(-1), framesOver33ms: s.times.filter(t => t > 33.3).length }; });
        (report.walks ??= []).push({ destinationZ: z, ...stats });
    }
    async function yaw(t) { await page.evaluate(t => { const c = document.querySelector('canvas'), cur = +c.dataset.playerYaw; c.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'mouse', buttons: 1, bubbles: true })); const e = new MouseEvent('mousemove', { buttons: 1, bubbles: true }); Object.defineProperty(e, 'movementX', { value: (cur - t) / .0023 }); Object.defineProperty(e, 'movementY', { value: 0 }); document.dispatchEvent(e); window.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'mouse', bubbles: true })); }, t); await page.waitForFunction(t => Math.abs(+document.querySelector('canvas').dataset.playerYaw - t) < .005, t); }
    async function capture(name) {
        const data = await page.evaluate(async () => {
            const state = window.__auditStore.getState(), renderer = state.gl, context = renderer.getContext(), debug = context.getExtension('WEBGL_debug_renderer_info');
            let warm = 0;
            await new Promise(resolve => { function tick() { if (++warm >= 30)
                resolve();
            else
                requestAnimationFrame(tick); } requestAnimationFrame(tick); });
            renderer.info.autoReset = false;
            renderer.info.reset();
            const times = [], calls = [], triangles = [];
            let prev = performance.now();
            await new Promise(resolve => { function tick(now) { times.push(now - prev); prev = now; calls.push(renderer.info.render.calls); triangles.push(renderer.info.render.triangles); renderer.info.reset(); if (times.length === 180)
                resolve();
            else
                requestAnimationFrame(tick); } requestAnimationFrame(tick); });
            renderer.info.autoReset = true;
            times.sort((a, b) => a - b);
            const textures = new Set(), geometries = new Set(), materials = new Set();
            let meshes = 0, instanced = 0, lights = 0, shadowLights = 0, textureBytes = 0, bufferBytes = 0;
            state.scene.traverse(o => { if (o.isLight) {
                lights++;
                if (o.castShadow)
                    shadowLights++;
            } if (o.isMesh) {
                meshes++;
                if (o.isInstancedMesh)
                    instanced++;
                if (o.geometry)
                    geometries.add(o.geometry);
                for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
                    if (!m)
                        continue;
                    materials.add(m);
                    for (const v of Object.values(m))
                        if (v?.isTexture)
                            textures.add(v);
                }
            } });
            for (const t of textures) {
                const images = Array.isArray(t.image) ? t.image : [t.image];
                for (const image of images)
                    if (image?.width && image?.height)
                        textureBytes += image.width * image.height * 4 * (t.generateMipmaps ? 4 / 3 : 1);
            }
            for (const g of geometries) {
                for (const a of Object.values(g.attributes))
                    bufferBytes += a.array?.byteLength ?? 0;
                bufferBytes += g.index?.array.byteLength ?? 0;
            }
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            return { room: document.querySelector('canvas').dataset.room, pose: JSON.parse(document.querySelector('canvas').dataset.playerPosition), yaw: +document.querySelector('canvas').dataset.playerYaw, renderer: debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER), vendor: debug ? context.getParameter(debug.UNMASKED_VENDOR_WEBGL) : context.getParameter(context.VENDOR), pixelRatio: renderer.getPixelRatio(), drawingBuffer: [renderer.domElement.width, renderer.domElement.height], toneMapping: renderer.toneMapping, exposure: renderer.toneMappingExposure, outputColorSpace: renderer.outputColorSpace, environment: !!state.scene.environment, frameMs: { mean: avg, median: times[90], p95: times[170], max: times[179] }, meanFps: 1000 / avg, drawCalls: { min: Math.min(...calls), max: Math.max(...calls) }, triangles: { min: Math.min(...triangles), max: Math.max(...triangles) }, gpuResourceCounts: { ...renderer.info.memory }, sceneObjects: { meshes, instanced, materials: materials.size, geometries: geometries.size, lights, shadowLights }, estimatedSceneTextureMiB: textureBytes / 1048576, geometryBufferMiB: bufferBytes / 1048576 };
        });
        report.rooms.push({ name, ...data });
        await page.screenshot({ path: out + '/after/' + name + '.png', timeout: 15000 });
        await writeFile(out + '/after.json', JSON.stringify(report, null, 2));
        console.log(name, JSON.stringify({ renderer: data.renderer, fps: data.meanFps, p95: data.frameMs.p95, calls: data.drawCalls.max, triangles: data.triangles.max, textures: data.gpuResourceCounts.textures }));
    }
    await capture('entrance');
    await move(-14);
    await yaw(Math.PI / 2);
    await capture('gallery');
    await yaw(0.36);
    await page.screenshot({ path: out + '/after/gallery-wide.png' });
    await page.getByRole('button', { name: 'Open settings' }).click();
    await page.getByRole('dialog', { name: 'Museum settings' }).locator('select').selectOption('high');
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.evaluate(() => window.__auditStore.getState().setDpr(1.5));
    await page.waitForTimeout(2000);
    await capture('gallery-high-2880x1620');
    await page.getByRole('button', { name: 'Open settings' }).click();
    await page.getByRole('dialog', { name: 'Museum settings' }).locator('select').selectOption('medium');
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.evaluate(() => window.__auditStore.getState().setDpr(1));
    await yaw(0);
    await move(-38);
    await yaw(-1);
    await capture('corridor');
    await yaw(0);
    await move(-78);
    await yaw(1.45);
    await capture('cinema');
    await yaw(0);
    await move(-95.8);
    await capture('forever');
    await page.keyboard.press('KeyE');
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    report.letterOpened = true;
    await move(20, 'KeyS');
    report.returnTripRoom = await page.locator('canvas').getAttribute('data-room');
    if (report.returnTripRoom !== 'entrance')
        throw Error('Return trip failed');
    await writeFile(out + '/after.json', JSON.stringify(report, null, 2));
}
finally {
    await browser.close();
}

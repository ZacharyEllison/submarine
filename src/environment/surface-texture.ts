import { CanvasTexture, SRGBColorSpace } from "@iwsdk/core";

/** Procedural sky/ocean image for periscope v1 (no external asset required). */
export function createSurfaceCanvasTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  const sky = ctx.createLinearGradient(0, 0, 0, 80);
  sky.addColorStop(0, "#4a90c8");
  sky.addColorStop(1, "#87ceeb");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 256, 80);

  ctx.fillStyle = "#1a5a7a";
  ctx.fillRect(0, 80, 256, 48);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.ellipse(180, 95, 35, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

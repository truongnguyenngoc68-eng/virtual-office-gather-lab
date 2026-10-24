import { ASSETS, LAYER_ORDER } from "../data/avatarAssets";

type AvatarConfig = Record<string, string | undefined>;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export async function composeAvatarSpriteSheetCanvas(params: {
  avatarConfig: AvatarConfig;
}): Promise<HTMLCanvasElement | null> {
  const { avatarConfig } = params;

  // Collect selected layer sources in draw order
  const selectedSrcs: string[] = [];
  for (const layerKey of LAYER_ORDER) {
    const selectedId = avatarConfig[layerKey];
    if (!selectedId) continue;
    const item = ASSETS?.[layerKey]?.find?.((x: any) => x?.id === selectedId);
    const src = item?.src as string | null | undefined;
    if (!src) continue;
    selectedSrcs.push(src);
  }

  if (selectedSrcs.length === 0) return null;

  // Load all images
  const images = await Promise.all(selectedSrcs.map(loadImage));

  const width = images[0].naturalWidth || images[0].width;
  const height = images[0].naturalHeight || images[0].height;
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Pixel art: keep crisp if scaled later
  ctx.imageSmoothingEnabled = false;

  // Draw each full sheet on top of previous ones
  for (const img of images) {
    ctx.drawImage(img, 0, 0);
  }

  return canvas;
}


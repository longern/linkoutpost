import {
  avatarCompressionThresholdBytes,
  avatarMaxDimension,
  profileImageMaxDimension,
  thumbnailCompressionThresholdBytes,
  thumbnailMaxDimension,
} from "./config";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

type PrepareImageOptions = {
  maxSize: number;
  maxOriginalBytes?: number;
  outputName?: string;
};

export type AvatarCrop = {
  offsetX: number;
  offsetY: number;
  scale: number;
  viewportSize: number;
};

export async function createCroppedAvatarFile(
  image: HTMLImageElement,
  { offsetX, offsetY, scale, viewportSize }: AvatarCrop,
): Promise<File> {
  if (
    !image.naturalWidth ||
    !image.naturalHeight ||
    scale <= 0 ||
    viewportSize <= 0
  ) {
    throw new Error("Avatar crop is unavailable");
  }

  const sourceSize = viewportSize / scale;
  const sourceX = Math.max(
    0,
    Math.min(
      image.naturalWidth - sourceSize,
      (image.naturalWidth - sourceSize) / 2 - offsetX / scale,
    ),
  );
  const sourceY = Math.max(
    0,
    Math.min(
      image.naturalHeight - sourceSize,
      (image.naturalHeight - sourceSize) / 2 - offsetY / scale,
    ),
  );
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Canvas is unavailable");

  canvas.width = avatarMaxDimension;
  canvas.height = avatarMaxDimension;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    avatarMaxDimension,
    avatarMaxDimension,
  );

  const blob =
    (await canvasToBlob(canvas, "image/webp", 0.9)) ??
    (await canvasToBlob(canvas, "image/jpeg", 0.92));

  if (!blob) throw new Error("Avatar crop failed");

  return new File(
    [blob],
    blob.type === "image/webp" ? "avatar.webp" : "avatar.jpg",
    { type: blob.type },
  );
}

export async function prepareImageFile(
  file: File,
  { maxSize, maxOriginalBytes, outputName }: PrepareImageOptions,
): Promise<File> {
  const image = await loadImage(file);
  const smallEnough =
    (maxOriginalBytes === undefined || file.size <= maxOriginalBytes) &&
    Math.max(image.naturalWidth, image.naturalHeight) <= maxSize;
  const staticBrowserImage = ["image/jpeg", "image/png", "image/webp"].includes(
    file.type,
  );

  if (smallEnough && staticBrowserImage) return file;

  const scale = Math.min(
    1,
    maxSize / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Canvas is unavailable");

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const blob =
    (await canvasToBlob(canvas, "image/webp", 0.86)) ??
    (await canvasToBlob(canvas, "image/jpeg", 0.88));

  if (!blob) throw new Error("Image compression failed");

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  const baseName =
    outputName ?? (file.name.replace(/\.[^.]+$/, "") || "image");
  return new File([blob], `${baseName}.${extension}`, { type: blob.type });
}

export function prepareAvatarFile(file: File): Promise<File> {
  return prepareImageFile(file, {
    maxSize: avatarMaxDimension,
    maxOriginalBytes: avatarCompressionThresholdBytes,
    outputName: "avatar",
  });
}

export function prepareProfileImageFile(file: File): Promise<File> {
  return prepareImageFile(file, { maxSize: profileImageMaxDimension });
}

export function prepareThumbnailFile(file: File): Promise<File> {
  return prepareImageFile(file, {
    maxSize: thumbnailMaxDimension,
    maxOriginalBytes: thumbnailCompressionThresholdBytes,
    outputName: "thumbnail",
  });
}

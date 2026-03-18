import imageCompression from "browser-image-compression";

const MAX_SIZE_MB = 1;
const MAX_WIDTH_OR_HEIGHT = 1920;

export async function compressPhoto(file: File): Promise<File> {
  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
    useWebWorker: true,
    fileType: "image/jpeg" as const,
  };

  const compressedFile = await imageCompression(file, options);
  return compressedFile;
}

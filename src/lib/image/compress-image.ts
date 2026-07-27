const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.7;

/**
 * Fotos de celular direto da câmera costumam vir com vários MB — redimensiona
 * pro maior lado caber em MAX_DIMENSION e reencoda em JPEG antes do upload.
 * Se decodificar falhar (formato não suportado pelo browser, ex. HEIC em
 * Chrome/Firefox) ou o resultado não for menor, sobe o arquivo original.
 */
export async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

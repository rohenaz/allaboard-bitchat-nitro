export const toB64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

export const UPLOAD_FILE_SIZE_LIMIT = 1024 * 50; // 50kb

export function formatBytes(bytes) {
  if (bytes < 1024) {
    return bytes + "B";
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(0) + "KB";
  } else {
    return (bytes / (1024 * 1024)).toFixed(0) + "MB";
  }
}

export function validateFile(file) {
  if (file.size > UPLOAD_FILE_SIZE_LIMIT) {
    return {
      valid: false,
      error: "File size exceeds the limit. Please choose a smaller file.",
    };
  }

  const isTypeSupported = ["image", "audio", "video"].some((t) =>
    file.type.includes(t)
  );

  if (!isTypeSupported) {
    return {
      valid: false,
      error: "File type not supported. Please choose a different file.",
    };
  }

  return { valid: true, error: "" };
}

export function getBase64Url(bFile) {
  if (!bFile || !bFile.Data || !bFile["content-type"]) {
    return null;
  }

  const b64Data = bFile.Data.utf8;
  const contentType = bFile["content-type"];

  if (!b64Data || !contentType) {
    return null;
  }

  return `data:${contentType};base64,${b64Data}`;
}

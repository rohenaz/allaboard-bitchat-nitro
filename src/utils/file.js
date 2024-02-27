/**
 * Converts a file to base64 format.
 * @param {File} file - The file to be converted.
 * @returns {Promise<string>} - A promise that resolves with the base64 representation of the file.
 */
export const toB64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

/**
 * The maximum file size limit for file uploads.
 */
export const UPLOAD_FILE_SIZE_LIMIT = 1024 * 50; // 50kb

/**
 * Formats the given number of bytes into a human-readable string.
 * @param {number} bytes - The number of bytes.
 * @returns {string} - The formatted string representing the file size.
 */
export function formatBytes(bytes) {
  if (bytes < 1024) {
    return bytes + "B";
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(0) + "KB";
  } else {
    return (bytes / (1024 * 1024)).toFixed(0) + "MB";
  }
}

/**
 * Checks if the given MIME type can be played by an audio or video element.
 * @param {string} mimeType - The MIME type to check.
 * @returns {boolean} - True if the MIME type can be played, false otherwise.
 */
function canPlayType(mimeType) {
  if (!mimeType) {
    return false;
  }

  const elementType = mimeType.startsWith("audio")
    ? "audio"
    : mimeType.startsWith("video")
    ? "video"
    : null;

  if (!elementType) {
    return false;
  }

  const dummyMediaElement = document.createElement(elementType);
  if (!dummyMediaElement.canPlayType) {
    console.log("canPlayType is not supported");
    return false;
  }

  return !!dummyMediaElement.canPlayType(mimeType);
}

/**
 * Validates the given file based on its size and type.
 * @param {File} file - The file to validate.
 * @returns {object} - An object with the validation result and error message (if any).
 */
export function validateFile(file) {
  if (file.size > UPLOAD_FILE_SIZE_LIMIT) {
    return {
      valid: false,
      error: "File size exceeds the limit. Please choose a smaller file.",
    };
  }

  const isImage = file.type.startsWith("image");
  const isTypeSupported = isImage || canPlayType(file.type);

  if (!isTypeSupported) {
    return {
      valid: false,
      error: "File type not supported. Please choose a different file.",
    };
  }

  return { valid: true, error: "" };
}

/**
 * Gets the base64 URL of a B file.
 * @param {object} bFile - The B file object containing the base64 data and content type.
 * @returns {string|null} - The base64 URL of the file, or null if the file object is invalid.
 */
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

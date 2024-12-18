import { forwardRef, useState } from "react";

const mediaElement = {
  image: "img",
  video: "video",
  audio: "audio",
};

const mediaElementProps = {
  image: {},
  video: {
    className: "object-contain w-full h-full",
    controls: true,
  },
  audio: {
    className: "w-full",
    controls: true,
  },
};

/**
 * Renders a file based on its type.
 *
 * @param {Object} props - The component props.
 * @param {string} props.type - The type of the file.
 * @param {string} props.data - The base64 data of the file.
 * @returns {JSX.Element|null} The rendered file component or null if the file type is not supported.
 */
export const FileRenderer = forwardRef(({ type, data, onClick }, ref) => {
  const [hasError, setHasError] = useState(false);
  const MediaElement = mediaElement[type];

  function handleClick() {
    /**
     * We're only handling the click event for images here,
     * since the other media types have their own controls.
     */
    if (type === "image" && onClick) {
      onClick();
    }
  }

  if (!MediaElement) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      <MediaElement
        ref={ref}
        src={data}
        onLoad={() => setHasError(false)}
        onError={() => setHasError(true)}
        {...mediaElementProps[type]}
        onClick={handleClick}
      />

      {hasError && (
        <div className="flex items-center justify-center absolute inset-0 bg-gray-800">
          <span className="text-sm font-medium text-red-400 select-none">
            Failed to load file
          </span>
        </div>
      )}
    </div>
  );
});

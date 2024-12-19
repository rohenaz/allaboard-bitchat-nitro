import { forwardRef, useState } from 'react';

type MediaType = 'image' | 'video' | 'audio';

const mediaElement: Record<MediaType, keyof JSX.IntrinsicElements> = {
  image: 'img',
  video: 'video',
  audio: 'audio',
};

const _mediaElementProps: Record<MediaType, Record<string, any>> = {
  image: {},
  video: {
    className: 'object-contain w-full h-full',
    controls: true,
  },
  audio: {
    className: 'w-full',
    controls: true,
  },
};

interface FileRendererProps {
  type: MediaType;
  data: string;
  onClick?: () => void;
}

/**
 * Renders a file based on its type.
 *
 * @param {FileRendererProps} props - The component props.
 * @returns {JSX.Element|null} The rendered file component or null if the file type is not supported.
 */
const FileRenderer = forwardRef<HTMLElement, FileRendererProps>(({ type, data, onClick }, ref) => {
  const [hasError, setHasError] = useState(false);
  const MediaElement = mediaElement[type];

  if (!MediaElement || hasError) {
    return null;
  }

  return (
    <MediaElement
      ref={ref}
      src={data}
      onClick={onClick}
      onError={() => setHasError(true)}
      {..._mediaElementProps[type]}
    />
  );
});

FileRenderer.displayName = 'FileRenderer';

export default FileRenderer;

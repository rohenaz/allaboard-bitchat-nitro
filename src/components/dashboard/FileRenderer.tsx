import type { JSX } from 'react';
import React, { forwardRef, useState } from 'react';

type MediaType = 'image' | 'video' | 'audio';

interface FileRendererProps {
  type: MediaType;
  data: string;
  onClick?: () => void;
}

type MediaElementType = HTMLImageElement | HTMLVideoElement | HTMLAudioElement;

interface MediaElementProps {
  alt?: string;
  className?: string;
  controls?: boolean;
  style?: React.CSSProperties;
}

const mediaElement: Record<MediaType, keyof JSX.IntrinsicElements> = {
  image: 'img',
  video: 'video',
  audio: 'audio',
};

const mediaElementProps: Record<MediaType, MediaElementProps> = {
  image: {
    alt: 'Media content',
  },
  video: {
    className: 'object-contain w-full h-full',
    controls: true,
  },
  audio: {
    className: 'w-full',
    controls: true,
  },
};

const FileRenderer = forwardRef<MediaElementType, FileRendererProps>(
  ({ type, data, onClick }, ref) => {
    const [hasError, setHasError] = useState(false);
    const MediaElement = mediaElement[type];

    if (!MediaElement || hasError) {
      return null;
    }

    return React.createElement(MediaElement, {
      ref,
      src: data,
      onClick,
      onError: () => setHasError(true),
      ...mediaElementProps[type],
    });
  },
);

FileRenderer.displayName = 'FileRenderer';

export default FileRenderer;

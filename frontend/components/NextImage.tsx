import Image from 'next/image';
import React from 'react';

interface NextImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

const NextImage: React.FC<NextImageProps> = ({ 
  src, 
  alt, 
  width = 0, 
  height = 0, 
  className = "",
  priority = false 
}) => {
  // Handle both local and external images
  const isExternalUrl = src.startsWith('http') || src.startsWith('https');

  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width || undefined}
        height={height || undefined}
        priority={priority}
        className={className}
        // Use fill property if width and height are not provided
        {...(width === 0 && height === 0 ? { fill: true } : {})}
        // Set sizing for external images
        {...(isExternalUrl ? { 
          loader: ({ src }) => src,
          unoptimized: true
        } : {})}
      />
    </div>
  );
};

export default NextImage;

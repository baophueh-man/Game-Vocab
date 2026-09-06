import React, { useState, useEffect } from 'react';
import { getImageFile } from '../../lib/storage';

interface SmartImageProps {
  src?: string;
  alt?: string;
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  loading?: "eager" | "lazy";
}

export default function SmartImage({ src, ...props }: SmartImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(
    src && src.startsWith('firestore://') ? undefined : src
  );

  useEffect(() => {
    let isMounted = true;
    if (src && src.startsWith('firestore://imageFiles/')) {
      const id = src.split('/').pop();
      if (id) {
        getImageFile(id).then(data => {
          if (isMounted && data) {
            setResolvedSrc(data);
          }
        });
      }
    } else {
      setResolvedSrc(src);
    }
    return () => { isMounted = false; };
  }, [src]);

  if (!resolvedSrc) {
    return <div className={`animate-pulse bg-slate-200 ${props.className || ''}`} />;
  }

  return <img src={resolvedSrc} {...props} />;
}

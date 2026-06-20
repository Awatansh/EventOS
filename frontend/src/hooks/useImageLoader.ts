import { useState, useEffect } from 'react';

export function useImageLoader(url?: string | null) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!url) {
      setIsLoaded(false);
      return;
    }

    setIsLoaded(false);

    const img = new Image();
    img.src = url;

    if (img.complete) {
      setIsLoaded(true);
      return;
    }

    const handleLoad = () => setIsLoaded(true);
    const handleError = () => setIsLoaded(false);

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [url]);

  return isLoaded;
}

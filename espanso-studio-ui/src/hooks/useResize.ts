import { useState, useCallback, useEffect, useRef } from 'react';

export const useResize = (initialWidth: number, minWidth: number, maxWidth: number) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const lastX = useRef<number>(0);

  const startResize = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    lastX.current = e.clientX;
  }, []);

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = lastX.current - e.clientX;
      lastX.current = e.clientX;
      setWidth((prev) => Math.min(Math.max(prev + delta, minWidth), maxWidth));
    },
    [isResizing, minWidth, maxWidth]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing, resize, stopResize]);

  return { width, startResize, isResizing };
};

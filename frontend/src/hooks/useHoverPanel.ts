import { useState, useCallback } from 'react';

export function useHoverPanel<T>() {
  const [hoveredItem, setHoveredItem] = useState<T | null>(null);

  const onHover = useCallback((item: T | null) => {
    setHoveredItem(item);
  }, []);

  return { hoveredItem, onHover };
}

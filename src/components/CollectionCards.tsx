import React, { useRef, useState } from 'react';

export interface CollectionItem {
  id: string;
  name: string;
  image?: string;
}

interface CollectionCardsProps {
  items?: CollectionItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export const CollectionCards: React.FC<CollectionCardsProps> = ({
  items = [],
  selectedId: controlledSelectedId,
  onSelect,
}) => {
  // If no real collections exist from the store catalog, render nothing
  if (!items || items.length === 0) {
    return null;
  }

  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    items[0]?.id || ''
  );
  const selectedId = controlledSelectedId ?? internalSelectedId;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const hasMovedRef = useRef(false);

  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.stopPropagation();
      el.scrollLeft += e.deltaY;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartX.current = e.pageX - el.offsetLeft;
    scrollStartX.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartX.current) * 1.3;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollStartX.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleCardClick = (id: string) => {
    if (hasMovedRef.current) return;
    if (onSelect) {
      onSelect(id);
    } else {
      setInternalSelectedId(id);
    }
  };

  return (
    <div className="w-full flex-shrink-0 select-none relative overflow-hidden bg-black text-white p-0 m-0">
      <div className="relative w-full p-0 m-0">
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          role="tablist"
          aria-label="Store collections"
          className="flex items-start gap-2.5 px-3 py-0 overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
        >
          {items.map((collection) => {
            const isSelected = collection.id === selectedId;

            return (
              <div
                key={collection.id}
                role="tab"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => handleCardClick(collection.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(collection.id);
                  }
                }}
                className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group outline-none p-0 m-0"
              >
                <div
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-xl relative overflow-hidden bg-neutral-900 transition-all duration-150 flex-shrink-0 ${
                    isSelected
                      ? 'ring-2 ring-white scale-[1.02]'
                      : 'border border-neutral-800 hover:border-neutral-500'
                  }`}
                >
                  {collection.image ? (
                    <img
                      src={collection.image}
                      alt={collection.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover p-0 m-0 select-none pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-neutral-400">
                      {collection.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center text-center max-w-[70px] sm:max-w-[76px] p-0 m-0">
                  <span
                    className={`text-[10px] sm:text-[11px] tracking-tight truncate w-full transition-colors duration-150 leading-tight ${
                      isSelected
                        ? 'text-white font-semibold'
                        : 'text-neutral-400 group-hover:text-white font-medium'
                    }`}
                  >
                    {collection.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CollectionCards;

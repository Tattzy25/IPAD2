import React, { useRef, useState, useEffect } from 'react';
import { Star } from 'lucide-react';

export interface ProductItem {
  id: string;
  title: string;
  image: string;
  rating: number;
  reviewCount: string;
  price: string;
}

export const PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviewCount: '2,410',
    price: '$398.00',
  },
  {
    id: 'prod-2',
    title: 'Minimalist Chrono Watch',
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviewCount: '842',
    price: '$245.00',
  },
  {
    id: 'prod-3',
    title: 'Instant Print Digital Camera',
    image:
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviewCount: '1,156',
    price: '$129.99',
  },
  {
    id: 'prod-4',
    title: 'Air Zoom Performance Runner',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviewCount: '3,120',
    price: '$160.00',
  },
  {
    id: 'prod-5',
    title: 'Polarized Classic Wayfarer',
    image:
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    reviewCount: '620',
    price: '$185.00',
  },
  {
    id: 'prod-6',
    title: 'Active Noise-Cancelling Earbuds',
    image:
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviewCount: '980',
    price: '$149.00',
  },
  {
    id: 'prod-7',
    title: 'Portable Studio Bluetooth Speaker',
    image:
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviewCount: '1,430',
    price: '$219.00',
  },
  {
    id: 'prod-8',
    title: 'Artisan Eau De Parfum 50ml',
    image:
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviewCount: '415',
    price: '$110.00',
  },
  {
    id: 'prod-9',
    title: 'Custom Mechanical RGB Keyboard',
    image:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviewCount: '1,890',
    price: '$179.00',
  },
  {
    id: 'prod-10',
    title: 'Water-Resistant Commuter Backpack',
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviewCount: '750',
    price: '$135.00',
  },
];

export const ProductCards: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    PRODUCTS.forEach((product) => {
      const img = new Image();
      img.src = product.image;
    });
  }, []);

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

  return (
    <div className="w-full flex-1 flex flex-col justify-center select-none relative overflow-hidden p-0 m-0">
      <div className="relative w-full p-0 m-0">
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex items-stretch gap-2.5 px-3 overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory"
        >
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              className="w-[calc((100%-30px)/4)] min-w-[155px] max-w-[210px] flex-shrink-0 snap-start flex flex-col justify-between bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-200/90 transition-transform duration-150 hover:-translate-y-0.5"
            >
              {/* Product Image - Edge-to-Edge with Zero Padding */}
              <div className="w-full h-24 sm:h-28 overflow-hidden bg-neutral-100 relative flex-shrink-0 p-0 m-0">
                <img
                  src={product.image}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none pointer-events-none p-0 m-0"
                  draggable={false}
                />
              </div>

              {/* Product Info Section */}
              <div className="p-2 flex flex-col justify-between flex-1">
                <h3
                  className="text-[12px] font-semibold text-neutral-900 tracking-tight line-clamp-1"
                  title={product.title}
                >
                  {product.title}
                </h3>

                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                  <span className="text-[11px] font-medium text-neutral-800">
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    ({product.reviewCount})
                  </span>
                </div>

                <div className="mt-0.5">
                  <span className="text-[13px] font-bold text-neutral-950 tracking-tight">
                    {product.price}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCards;

import { useState } from 'react';
import { Package } from 'lucide-react';

const SIZE_CLASSES = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-24 w-24',
};

/**
 * Renders a product image with a graceful fallback when the source is missing
 * or fails to load. Centralizes the "no image" treatment so every product
 * surface (table, form, view) looks consistent.
 */
export default function ProductImage({ src, alt = 'Product image', size = 'md', className = '' }) {
  const [broken, setBroken] = useState(false);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  if (!src || broken) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-gray-100 text-gray-400 ${sizeClass} ${className}`}
        aria-label={alt}
      >
        <Package className="h-1/3 w-1/3" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-md object-cover ${sizeClass} ${className}`}
      onError={() => setBroken(true)}
    />
  );
}

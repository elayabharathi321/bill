import { Package } from 'lucide-react';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';
import ProductImage from './ProductImage';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Read-only product detail card rendered inside a Modal.
 * Resolves the category name from the provided list and computes a stock
 * status badge so the same low-stock logic used in the table stays consistent.
 */
export default function ProductView({ product, categories, onClose }) {
  if (!product) return null;

  const category = (categories || []).find((c) => c.id === product.categoryId);
  const qty = Number(product.stockQuantity) || 0;
  const min = Number(product.minimumStock) || 0;
  const isOut = qty === 0;
  const isLow = qty <= min;

  const stockBadge = isOut ? (
    <StatusBadge status="error" label="Out of stock" />
  ) : isLow ? (
    <StatusBadge status="warning" label="Low stock" />
  ) : (
    <StatusBadge status="success" label="In stock" />
  );

  const fields = [
    ['SKU', product.sku || '—'],
    ['Barcode', product.barcode || '—'],
    ['Category', category ? category.name : product.categoryId ? `#${product.categoryId}` : '—'],
    ['Brand', product.brand || '—'],
    ['Unit', product.unit || '—'],
    ['Purchase Price', formatCurrency(product.purchasePrice)],
    ['Selling Price', formatCurrency(product.sellingPrice)],
    ['Tax Rate', `${Number(product.taxRate) || 0}%`],
    ['Stock Quantity', String(qty)],
    ['Minimum Stock', String(min)],
    ['Status', <StatusBadge status={product.status} />],
    ['Created At', formatDate(product.createdAt)],
    ['Updated At', formatDate(product.updatedAt)],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <ProductImage src={product.image} alt={product.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-xl font-semibold text-gray-900">{product.name}</h2>
          <div className="mt-1 flex items-center gap-2">
            {stockBadge}
            <span className="text-xs text-gray-500">
              {qty <= min ? `At or below the minimum of ${min} units` : `Minimum ${min} units`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="sm:col-span-1">
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-700">{value}</dd>
          </div>
        ))}
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">Description</dt>
          <dd className="mt-1 text-sm text-gray-700 break-words">
            {product.description || '—'}
          </dd>
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-4">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

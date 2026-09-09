import { useForm } from 'react-hook-form';
import { PlusCircle, MinusCircle } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { validators } from '../../utils/validators';
import {
  ADJUSTMENT_IN_REASONS,
  ADJUSTMENT_OUT_REASONS,
} from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

const TYPE_OPTIONS = [
  { value: 'ADJUSTMENT_IN', label: 'Add Stock' },
  { value: 'ADJUSTMENT_OUT', label: 'Remove Stock' },
];

function toDefaults(initialData) {
  return {
    productId: initialData?.id ?? '',
    type: 'ADJUSTMENT_IN',
    quantity: '',
    reason: '',
  };
}

/**
 * Stock adjustment form rendered inside a Modal.
 *
 * Handles both stock additions (ADJUSTMENT_IN) and removals (ADJUSTMENT_OUT).
 * When `product` is provided the product is locked and only the adjustment
 * details are editable. When omitted the user must pick a product from the
 * supplied `products` list.
 *
 * All values are forwarded to `onSave` as a plain object so the parent page
 * can call the service layer (inventoryService.adjustStock).
 */
export default function StockAdjustmentForm({
  product = null,
  products = [],
  onSave,
  onCancel,
  submitLabel = 'Apply Adjustment',
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: toDefaults(product) });

  const watchType = watch('type');
  const watchReason = watch('reason');
  const watchQuantity = watch('quantity');

  const reasonOptions =
    watchType === 'ADJUSTMENT_OUT'
      ? ADJUSTMENT_OUT_REASONS
      : ADJUSTMENT_IN_REASONS;

  const activeProducts = (products || []).filter(
    (p) => !p.status || p.status === 'active'
  );
  const productOptions = activeProducts.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.sku})`,
  }));

  const selectedProduct =
    product ||
    activeProducts.find((p) => p.id === Number(watch('productId')));
  const currentStock = selectedProduct
    ? Number(selectedProduct.stockQuantity) || 0
    : 0;
  const projectedStock =
    watchQuantity && selectedProduct
      ? watchType === 'ADJUSTMENT_IN'
        ? currentStock + (Number(watchQuantity) || 0)
        : currentStock - (Number(watchQuantity) || 0)
      : currentStock;

  const showCustomReason = watchReason === 'Other';

  const onSubmit = handleSubmit(async (rawData) => {
    const sanitized = {
      productId: Number(rawData.productId),
      type: rawData.type,
      quantity: Number(rawData.quantity),
      reason: showCustomReason
        ? rawData.customReason || rawData.reason
        : rawData.reason,
    };
    try {
      await onSave(sanitized);
    } catch {
      // Errors are surfaced by the parent via toast.
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        {/* Product selector (only when no product is pre-selected) */}
        {!product && (
          <div className="md:col-span-2">
            <Select
              label="Product"
              placeholder="Select a product"
              options={productOptions}
              error={errors.productId?.message}
              {...register('productId', {
                validate: (v) =>
                  !v && v !== 0 ? 'Please select a product' : true,
              })}
            />
          </div>
        )}

        {/* Adjustment type */}
        <div className="md:col-span-2">
          <Select
            label="Adjustment Type"
            placeholder="Select adjustment type"
            options={TYPE_OPTIONS}
            error={errors.type?.message}
            {...register('type', {
              validate: validators.required('Adjustment type is required'),
            })}
          />
        </div>

        {/* Quantity */}
        <div>
          <Input
            label="Quantity"
            type="number"
            placeholder="0"
            min="1"
            step="1"
            error={errors.quantity?.message}
            {...register('quantity', {
              validate: (v) =>
                !v || v === ''
                  ? 'Quantity is required'
                  : Number(v) > 0 && Number.isInteger(Number(v))
                  ? true
                  : 'Enter a valid whole number greater than zero',
            })}
          />
        </div>

        {/* Reason */}
        <div className="md:col-span-2">
          <Select
            label="Reason"
            placeholder="Select a reason"
            options={reasonOptions.map((r) => ({ value: r, label: r }))}
            error={errors.reason?.message}
            {...register('reason')}
          />
        </div>

        {showCustomReason && (
          <div className="md:col-span-2">
            <Input
              label="Custom reason"
              placeholder="Describe the adjustment"
              error={errors.customReason?.message}
              {...register('customReason', {
                validate: validators.required('Please enter a reason'),
              })}
            />
          </div>
        )}

        {/* Stock projection */}
        {selectedProduct && (
          <div className="md:col-span-2">
            <div className="rounded-md bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Current stock:</span>{' '}
                {currentStock} units
              </p>
              <p className="mt-1 text-sm text-gray-600">
                <span className="font-medium">Projected stock:</span>{' '}
                <span
                  className={
                    projectedStock < 0
                      ? 'text-red-600'
                      : projectedStock === 0
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }
                >
                  {projectedStock < 0 ? 0 : projectedStock} units
                </span>
              </p>
              {selectedProduct.purchasePrice &&
                (Number(watchQuantity) || 0) > 0 && (
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="font-medium">Stock value change:</span>{' '}
                    {watchType === 'ADJUSTMENT_IN' ? '+' : '-'}
                    {formatCurrency(
                      (Number(watchQuantity) || 0) *
                        (Number(selectedProduct.purchasePrice) || 0)
                    )}
                  </p>
                )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          icon={watchType === 'ADJUSTMENT_IN' ? PlusCircle : MinusCircle}
          disabled={
            isSubmitting ||
            (watchType === 'ADJUSTMENT_OUT' &&
              currentStock > 0 &&
              (Number(watchQuantity) || 0) > currentStock)
          }
        >
          {submitLabel}
        </Button>
      </div>

      {watchType === 'ADJUSTMENT_OUT' &&
        currentStock > 0 &&
        (Number(watchQuantity) || 0) > currentStock && (
          <p className="text-xs text-red-600">
            Cannot remove more than the current stock ({currentStock} units).
          </p>
        )}
    </form>
  );
}

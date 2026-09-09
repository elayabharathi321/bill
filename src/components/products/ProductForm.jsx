import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Package, Trash2, Upload } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import { validators } from '../../utils/validators';

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'bag', label: 'Bag' },
  { value: 'box', label: 'Box' },
  { value: 'ream', label: 'Ream' },
  { value: 'pack', label: 'Pack' },
  { value: 'liter', label: 'Liter' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'dozen', label: 'Dozen' },
];

const TAX_OPTIONS = [
  { value: 0, label: '0%' },
  { value: 5, label: '5%' },
  { value: 7, label: '7%' },
  { value: 12, label: '12%' },
  { value: 18, label: '18%' },
  { value: 28, label: '28%' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

function toDefaults(initialData) {
  if (!initialData) {
    return {
      name: '',
      sku: '',
      barcode: '',
      categoryId: '',
      brand: '',
      unit: 'pcs',
      purchasePrice: '',
      sellingPrice: '',
      taxRate: '',
      stockQuantity: 0,
      minimumStock: 0,
      image: '',
      status: 'active',
      description: '',
    };
  }
  return {
    name: initialData.name ?? '',
    sku: initialData.sku ?? '',
    barcode: initialData.barcode ?? '',
    categoryId: initialData.categoryId ?? '',
    brand: initialData.brand ?? '',
    unit: initialData.unit ?? 'pcs',
    purchasePrice: initialData.purchasePrice ?? '',
    sellingPrice: initialData.sellingPrice ?? '',
    taxRate: initialData.taxRate ?? '',
    stockQuantity: initialData.stockQuantity ?? 0,
    minimumStock: initialData.minimumStock ?? 0,
    image: initialData.image ?? '',
    status: initialData.status ?? 'active',
    description: initialData.description ?? '',
  };
}

/** Reusable validation fragments. */
const requiredMsg = (field) => `${field} is required`;
const nonNegativeMsg = (field) => `${field} must be zero or greater`;
const numberMsg = (field) => `Enter a valid ${field.toLowerCase()}`;

/**
 * Product create / edit form.
 *
 * Uses React Hook Form for validation and delegates the actual API call to the
 * parent via `onSave(data)`. The form only sanitizes field types (numbers,
 * empty strings -> null) and surfaces submit errors returned by the service.
 */
export default function ProductForm({ initialData, categories, onSave, onCancel, submitLabel = 'Save' }) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: toDefaults(initialData) });

  const [submitError, setSubmitError] = useState('');
  const [imagePreview, setImagePreview] = useState(initialData?.image || '');
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  const activeCategories = (categories || []).filter(
    (category) => !category.status || category.status === 'active'
  );

  const onSubmit = handleSubmit(async (rawData) => {
    setSubmitError('');
    const sanitized = {
      ...rawData,
      categoryId: rawData.categoryId ? Number(rawData.categoryId) : null,
      unit: rawData.unit || 'pcs',
      purchasePrice: Number(rawData.purchasePrice),
      sellingPrice: Number(rawData.sellingPrice),
      taxRate: Number(rawData.taxRate),
      stockQuantity: Number(rawData.stockQuantity),
      minimumStock: Number(rawData.minimumStock),
      barcode: rawData.barcode || null,
      brand: rawData.brand || null,
      image: rawData.image || null,
      status: rawData.status || 'active',
      description: rawData.description || null,
    };
    try {
      await onSave(sanitized);
    } catch (err) {
      setSubmitError(err?.message || 'Something went wrong. Please try again.');
    }
  });

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError('');
    if (!file.type.startsWith('image/')) {
      setImageError('Only image files (PNG, JPG, GIF) are allowed.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be smaller than 2 MB.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataURL(file);
      setImagePreview(dataUrl);
      setValue('image', dataUrl, { shouldValidate: false });
    } catch (err) {
      setImageError(err.message);
    }
  };

  const clearImage = () => {
    setImagePreview('');
    setValue('image', '', { shouldValidate: false });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      {submitError && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Product name"
            placeholder="e.g. Wireless Mouse"
            error={errors.name?.message}
            {...register('name', {
              validate: validators.required(requiredMsg('Product name')),
            })}
          />
        </div>

        <Input
          label="SKU"
          placeholder="e.g. EL-1001"
          error={errors.sku?.message}
          {...register('sku', { validate: validators.required(requiredMsg('SKU')) })}
        />
        <Input
          label="Barcode"
          placeholder="e.g. 012345678905"
          error={errors.barcode?.message}
          {...register('barcode')}
        />

        <div className="md:col-span-2">
          <Select
            label="Category"
            placeholder="Select a category"
            options={activeCategories.map((c) => ({ value: c.id, label: c.name }))}
            error={errors.categoryId?.message}
            {...register('categoryId', {
              validate: (v) =>
                !v && v !== 0 ? requiredMsg('Category') : true,
            })}
          />
        </div>

        <Input
          label="Brand"
          placeholder="e.g. Logitech"
          error={errors.brand?.message}
          {...register('brand')}
        />
        <Select
          label="Unit"
          placeholder="Select a unit"
          options={UNIT_OPTIONS}
          error={errors.unit?.message}
          {...register('unit')}
        />

        <Input
          label="Purchase Price"
          type="number"
          placeholder="0.00"
          step="0.01"
          min="0"
          error={errors.purchasePrice?.message}
          {...register('purchasePrice', {
            validate: (v) =>
              v === '' || v === undefined || v === null
                ? requiredMsg('Purchase price')
                : Number.isFinite(Number(v)) && Number(v) >= 0
                ? true
                : numberMsg('Purchase price'),
          })}
        />
        <Input
          label="Selling Price"
          type="number"
          placeholder="0.00"
          step="0.01"
          min="0"
          error={errors.sellingPrice?.message}
          {...register('sellingPrice', {
            validate: (v, form) => {
              if (v === '' || v === undefined || v === null) return requiredMsg('Selling price');
              const num = Number(v);
              if (!Number.isFinite(num) || num <= 0) return numberMsg('Selling price');
              const cost = Number(form.purchasePrice);
              if (Number.isFinite(cost) && num < cost)
                return 'Selling price must be at least the purchase price';
              return true;
            },
          })}
        />

        <Select
          label="Tax Rate (%)"
          placeholder="Select tax rate"
          options={TAX_OPTIONS}
          error={errors.taxRate?.message}
          {...register('taxRate', {
            validate: (v) =>
              v === '' || v === undefined || v === null
                ? requiredMsg('Tax rate')
                : Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 100
                ? true
                : numberMsg('Tax rate'),
          })}
        />
        <Select
          label="Status"
          placeholder="Select status"
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          {...register('status', {
            validate: (v) => (!v ? requiredMsg('Status') : true),
          })}
        />

        <Input
          label="Stock Quantity"
          type="number"
          placeholder="0"
          min="0"
          error={errors.stockQuantity?.message}
          {...register('stockQuantity', {
            validate: (v) =>
              v === '' || v === undefined || v === null
                ? requiredMsg('Stock quantity')
                : Number.isInteger(Number(v)) && Number(v) >= 0
                ? true
                : nonNegativeMsg('Stock quantity'),
          })}
        />
        <Input
          label="Minimum Stock"
          type="number"
          placeholder="0"
          min="0"
          error={errors.minimumStock?.message}
          {...register('minimumStock', {
            validate: (v) =>
              v === '' || v === undefined || v === null
                ? requiredMsg('Minimum stock')
                : Number.isInteger(Number(v)) && Number(v) >= 0
                ? true
                : nonNegativeMsg('Minimum stock'),
          })}
        />

        {/* Product image upload */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Product Image</label>
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="h-20 w-20 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={imagePreview ? undefined : Upload}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? 'Change image' : 'Upload image'}
              </Button>
              {imagePreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  className="ml-2"
                  onClick={clearImage}
                  aria-label="Remove image"
                />
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
              <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 2 MB.</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Description"
            placeholder="Optional product description"
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

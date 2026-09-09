import { useEffect, useMemo, useState } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import Button from '../../components/common/Button';
import Dropdown from '../../components/common/Dropdown';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../components/common/Toast';
import { useConfirm } from '../../components/common/ConfirmDialog';
import ModuleIndexPage from '../../components/common/ModuleIndexPage';
import ProductImage from '../../components/products/ProductImage';
import ProductForm from '../../components/products/ProductForm';
import ProductView from '../../components/products/ProductView';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { formatCurrency } from '../../utils/formatters';

const STATUS_FILTER_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const SORT_OPTIONS = [
  { label: 'Name (A-Z)', value: 'name', order: 'asc' },
  { label: 'Name (Z-A)', value: 'name', order: 'desc' },
  { label: 'Price (low to high)', value: 'sellingPrice', order: 'asc' },
  { label: 'Price (high to low)', value: 'sellingPrice', order: 'desc' },
  { label: 'Stock (low to high)', value: 'stockQuantity', order: 'asc' },
  { label: 'Stock (high to low)', value: 'stockQuantity', order: 'desc' },
  { label: 'Newest first', value: 'createdAt', order: 'desc' },
  { label: 'Oldest first', value: 'createdAt', order: 'asc' },
];

/** Render the stock quantity with a low-stock / out-of-stock indicator. */
function stockCell(row) {
  const qty = Number(row.stockQuantity) || 0;
  const min = Number(row.minimumStock) || 0;
  const isOut = qty === 0;
  const isLow = !isOut && qty <= min;

  if (isOut) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="font-medium text-red-600">{qty}</span>
        <StatusBadge status="error" label="Out of stock" />
      </div>
    );
  }
  if (isLow) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="font-medium text-amber-600">{qty}</span>
        <StatusBadge status="warning" label="Low stock" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-end gap-1.5">
      <span className="font-medium text-emerald-600">{qty}</span>
      <StatusBadge status="success" label="In stock" />
    </div>
  );
}

// Stable column definitions (ModuleIndexPage reads `row.category` from `_expand`).
const COLUMNS = [
  {
    key: 'name',
    header: 'Product',
    render: (row) => (
      <div className="flex items-center gap-2">
        <ProductImage src={row.image} alt={row.name} size="sm" />
        <span className="font-medium text-gray-900">{row.name}</span>
      </div>
    ),
  },
  { key: 'sku', header: 'SKU' },
  {
    key: 'category',
    header: 'Category',
    render: (row) =>
      row.category?.name || (row.categoryId ? `#${row.categoryId}` : '—'),
  },
  {
    key: 'purchasePrice',
    header: 'Purchase Price',
    align: 'right',
    render: (row) => formatCurrency(row.purchasePrice),
  },
  {
    key: 'sellingPrice',
    header: 'Selling Price',
    align: 'right',
    render: (row) => formatCurrency(row.sellingPrice),
  },
  {
    key: 'stockQuantity',
    header: 'Stock',
    align: 'right',
    render: (row) => stockCell(row),
  },
  {
    key: 'taxRate',
    header: 'Tax',
    align: 'right',
    render: (row) => `${Number(row.taxRate) || 0}%`,
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
];

/**
 * Products module.
 *
 * Full CRUD over the `/products` resource: list with search / filter / sort /
 * pagination (via ModuleIndexPage) plus add / edit / view / delete modals.
 * All data flows through the service layer so the JSON Server backend can be
 * swapped for Spring Boot without touching this page.
 */
export default function ProductsPage() {
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'view'
  const [selected, setSelected] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  // Categories power both the category filter and the form's category select.
  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories]
  );

  const filters = useMemo(
    () => [
      {
        key: 'categoryId',
        label: 'Category',
        placeholder: 'All categories',
        options: categoryOptions,
        className: 'w-48',
      },
      {
        key: 'status',
        label: 'Status',
        placeholder: 'All status',
        options: STATUS_FILTER_OPTIONS,
        className: 'w-40',
      },
    ],
    [categoryOptions]
  );

  const reset = () => {
    setModalMode(null);
    setSelected(null);
  };

  const openAdd = () => {
    setSelected(null);
    setModalMode('add');
  };
  const openEdit = (row) => {
    setSelected(row);
    setModalMode('edit');
  };
  const openView = (row) => {
    setSelected(row);
    setModalMode('view');
  };

  const handleDelete = async (row) => {
    const confirmed = await confirm({
      title: 'Delete product?',
      message: `Remove "${row.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      await deleteProduct(row.id);
      toast.success('Product deleted successfully.');
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast.error(err.message || 'Failed to delete product.');
    }
  };

  const handleAddSave = async (data) => {
    const now = new Date().toISOString();
    try {
      await createProduct({ ...data, createdAt: now, updatedAt: now });
      toast.success('Product added successfully.');
      setModalMode(null);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast.error(err.message || 'Failed to add product.');
    }
  };

  const handleEditSave = async (data) => {
    try {
      await updateProduct(selected.id, {
        ...data,
        createdAt: selected.createdAt,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Product updated successfully.');
      setModalMode(null);
      setSelected(null);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast.error(err.message || 'Failed to update product.');
    }
  };

  return (
    <>
      <ModuleIndexPage
        title="Products"
        description="Manage the product catalogue, pricing and stock levels."
        getData={getProducts}
        columns={COLUMNS}
        baseParams={{ _expand: 'category' }}
        filters={filters}
        sortOptions={SORT_OPTIONS}
        defaultSort="createdAt"
        defaultOrder="desc"
        searchPlaceholder="Search products…"
        emptyTitle="No products yet"
        emptyDescription="Products will appear here once you start building your catalogue."
        actions={<Button icon={Plus} onClick={openAdd}>Add Product</Button>}
        rowActions={(row) => (
          <Dropdown
            align="right"
            trigger={
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
            items={[
              { label: 'View', onClick: () => openView(row) },
              { label: 'Edit', onClick: () => openEdit(row) },
              'divider',
              { label: 'Delete', danger: true, onClick: () => handleDelete(row) },
            ]}
          />
        )}
        actionHeader="Actions"
        refreshKey={refreshKey}
      />

      {/* Add / Edit product */}
      <Modal
        open={modalMode === 'add' || modalMode === 'edit'}
        onClose={reset}
        title={modalMode === 'add' ? 'Add Product' : 'Edit Product'}
        description="Fill in the product details below."
        size="xl"
      >
        {modalMode && (
          <ProductForm
            key={selected?.id || 'new'}
            initialData={modalMode === 'edit' ? selected : null}
            categories={categories}
            onSave={modalMode === 'add' ? handleAddSave : handleEditSave}
            onCancel={reset}
            submitLabel={modalMode === 'add' ? 'Create product' : 'Save changes'}
          />
        )}
      </Modal>

      {/* View product */}
      <Modal
        open={modalMode === 'view'}
        onClose={reset}
        title="Product Details"
        description="Read-only view of the product record."
        size="xl"
      >
        <ProductView
          key={selected?.id || 'view'}
          product={selected}
          categories={categories}
          onClose={reset}
        />
      </Modal>
    </>
  );
}

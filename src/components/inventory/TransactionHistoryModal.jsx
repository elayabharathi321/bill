import { useEffect, useState } from 'react';
import { formatDateTime, formatNumber } from '../../utils/formatters';
import { TRANSACTION_TYPE_LABELS } from '../../utils/constants';
import { getInventoryTransactions } from '../../services/inventoryService';
import Modal from '../common/Modal';
import Table from '../common/Table';
import StatusBadge from '../common/StatusBadge';
import Skeleton from '../common/Skeleton';
import ErrorState from '../common/ErrorState';
import Button from '../common/Button';

const TRANSACTION_COLUMNS = [
  {
    key: 'type',
    header: 'Type',
    render: (row) => (
      <StatusBadge
        status={row.type}
        label={TRANSACTION_TYPE_LABELS[row.type] || row.type}
      />
    ),
  },
  {
    key: 'quantity',
    header: 'Qty Change',
    align: 'right',
    render: (row) => {
      const isIncrease =
        row.type === 'PURCHASE' ||
        row.type === 'RETURN' ||
        row.type === 'ADJUSTMENT_IN';
      const sign = isIncrease ? '+' : '-';
      return (
        <span className={isIncrease ? 'text-emerald-600' : 'text-red-600'}>
          {sign}
          {formatNumber(row.quantity)}
        </span>
      );
    },
  },
  {
    key: 'previousStock',
    header: 'Previous Stock',
    align: 'right',
    render: (row) => formatNumber(row.previousStock || 0),
  },
  {
    key: 'newStock',
    header: 'New Stock',
    align: 'right',
    render: (row) => {
      const newStock = Number(row.newStock) || 0;
      const minStock = Number(row.product?.minimumStock) || 0;
      const color =
        newStock === 0
          ? 'text-red-600'
          : newStock <= minStock
          ? 'text-amber-600'
          : 'text-emerald-600';
      return (
        <span className={`font-medium ${color}`}>{formatNumber(newStock)}</span>
      );
    },
  },
  {
    key: 'reason',
    header: 'Reason',
    render: (row) => row.reason || '—',
  },
  {
    key: 'referenceType',
    header: 'Reference',
    render: (row) => {
      if (!row.referenceType) return '—';
      const label =
        {
          purchase: 'Purchase',
          invoice: 'Invoice',
          return: 'Return',
          manual: 'Manual',
        }[row.referenceType] || row.referenceType;
      const refId = row.referenceId ? ` #${row.referenceId}` : '';
      return (
        <span className="text-sm text-gray-600">
          {label}
          {refId}
        </span>
      );
    },
  },
  {
    key: 'createdAt',
    header: 'Date',
    render: (row) => formatDateTime(row.createdAt),
  },
];

/**
 * Transaction history viewer rendered inside a Modal.
 * When `productId` is provided, only that product's transactions are shown.
 * Data flows through the service layer (inventoryService).
 */
export default function TransactionHistoryModal({ open, onClose, productId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setData([]);
      return;
    }

    const params = {
      _sort: 'createdAt',
      _order: 'desc',
      _expand: 'product',
    };
    if (productId) {
      params.productId = productId;
    }

    setLoading(true);
    setError(null);
    getInventoryTransactions(params)
      .then(({ data: result }) => {
        setData(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load transaction history.');
      })
      .finally(() => setLoading(false));
  }, [open, productId]);

  const body = () => {
    if (loading) {
      return <Skeleton className="h-11" count={8} />;
    }
    if (error) {
      return <ErrorState message={error} onRetry={() => {}} />;
    }
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No transactions found</p>
          <p className="mt-1 text-sm text-gray-400">
            Stock movements will appear here once they are recorded.
          </p>
        </div>
      );
    }
    return <Table columns={TRANSACTION_COLUMNS} data={data} />;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={productId ? 'Stock History' : 'Transaction History'}
      description={
        productId
          ? 'Historical stock movements for this product'
          : 'All inventory transactions across the catalogue'
      }
      size="xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {body()}
    </Modal>
  );
}

import { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import Card from "../../../components/common/Card";
import { getCustomerOutstanding } from "../../../services/paymentService";
import { formatCurrency } from "../../../utils/formatters";

/** Outstanding customer balances panel (spec: Customer Outstanding). */
export default function OutstandingPanel({ refreshKey = 0 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomerOutstanding();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <Card title="Customer Outstanding" description="Customers with unpaid balances.">
      {loading ? (
        <p className="text-sm text-gray-500">Loading outstanding balances…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-emerald-600">All customers are fully paid. No outstanding balances.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => (
            <li key={r.customerId} className="flex items-center justify-between gap-3 py-2">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <AlertCircle className="h-4 w-4 text-red-500" />
                {r.name} <span className="font-normal text-gray-400">#{r.customerId}</span>
              </span>
              <span className="text-sm font-semibold text-red-600">{formatCurrency(r.outstanding)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

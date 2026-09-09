import { CreditCard } from "lucide-react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Input from "../../../components/common/Input";
import {
  calculateBalance,
  getPaymentStatus,
} from "../../../utils/calculations";
import { formatCurrency } from "../../../utils/formatters";

/**
 * Payment Panel Component
 * Handles payment method selection and amount input
 */
export default function PaymentPanel({
  grandTotal,
  paidAmount,
  paymentMethod,
  onPaymentMethodChange,
  onPaidAmountChange,
  onCompleteTransaction,
}) {
  const balance = calculateBalance(grandTotal, paidAmount);
  const paymentStatus = getPaymentStatus(paidAmount, grandTotal);

  const paymentMethods = [
    { value: "CASH", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "CARD", label: "Card" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "CREDIT", label: "Credit" },
  ];

  const handleQuickAmount = (percentage) => {
    onPaidAmountChange(grandTotal * (percentage / 100));
  };

  return (
    <Card className="space-y-4 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100">
      {/* Payment Method Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((method) => (
            <button
              key={method.value}
              onClick={() => onPaymentMethodChange(method.value)}
              className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                paymentMethod === method.value
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>
      </div>

      {/* Paid Amount Input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Paid Amount
        </label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={paidAmount}
          onChange={(e) => onPaidAmountChange(Number(e.target.value) || 0)}
          placeholder="0.00"
        />
      </div>

      {/* Quick Amount Buttons */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Quick Pay
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleQuickAmount(100)}
            className="rounded-md bg-emerald-500 px-2 py-2 text-xs font-medium text-white hover:bg-emerald-600"
          >
            100%
          </button>
          <button
            onClick={() => onPaidAmountChange(0)}
            className="rounded-md bg-gray-300 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-400"
          >
            Clear
          </button>
          <button
            onClick={() => onPaidAmountChange(grandTotal)}
            className="rounded-md bg-blue-500 px-2 py-2 text-xs font-medium text-white hover:bg-blue-600"
          >
            Exact
          </button>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="space-y-2 bg-white rounded-lg p-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(grandTotal)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Paid Amount:</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(paidAmount)}
          </span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between">
          <span className="font-medium text-gray-900">Balance:</span>
          <span
            className={`text-lg font-bold ${
              balance >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {balance >= 0 ? "Change: " : "Due: "}
            {formatCurrency(Math.abs(balance))}
          </span>
        </div>
      </div>

      {/* Payment Status */}
      <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
        <span className="text-xs font-medium text-gray-600">Status:</span>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            paymentStatus === "PAID"
              ? "bg-emerald-100 text-emerald-700"
              : paymentStatus === "PARTIAL"
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {paymentStatus}
        </span>
      </div>

      {/* Complete Transaction Button */}
      <Button
        onClick={onCompleteTransaction}
        icon={CreditCard}
        className="w-full"
        size="lg"
        disabled={grandTotal === 0}
      >
        Complete Transaction
      </Button>
    </Card>
  );
}

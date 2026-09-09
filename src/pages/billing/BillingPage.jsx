import { useCallback, useEffect, useState } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Package,
} from "lucide-react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import Skeleton from "../../components/common/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/common/Toast";
import * as billingService from "../../services/billingService";
import * as productService from "../../services/productService";
import * as customerService from "../../services/customerService";
import * as categoryService from "../../services/categoryService";
import {
  calculateCartTotals,
  applyBillDiscount,
  calculateBalance,
  getPaymentStatus,
  round,
} from "../../utils/calculations";
import { formatCurrency } from "../../utils/formatters";

import ProductSearch from "./components/ProductSearch";
import CartSummary from "./components/CartSummary";
import CustomerSelector from "./components/CustomerSelector";
import PaymentPanel from "./components/PaymentPanel";
import TransactionReceipt from "./components/TransactionReceipt";

/**
 * Billing / POS Page
 *
 * Main transaction screen with:
 * - Product search and category filtering
 * - Cart with quantity controls
 * - Customer selection
 * - Bill calculations
 * - Payment processing
 * - Receipt generation
 */
export default function BillingPage() {
  const { user } = useAuth();
  const toast = useToast();

  // ========== State Management ==========
  const [cartItems, setCartItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bill calculations
  const [totals, setTotals] = useState({
    subtotal: 0,
    itemDiscount: 0,
    afterItemDiscount: 0,
    cartDiscount: 0,
    taxAmount: 0,
    grandTotal: 0,
  });
  const [billDiscountPercent, setBillDiscountPercent] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [billNumber, setBillNumber] = useState("");

  // UI states
  const [activeTab, setActiveTab] = useState("search"); // 'search' or 'cart'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ========== Data Loading ==========
  useEffect(() => {
    loadInitialData();
  }, []);

  // ========== Data Loading ==========
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
      ]);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      generateBillNumber();
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ========== Bill Number Generation ==========
  const generateBillNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    setBillNumber(`BILL-${timestamp}-${random}`);
  };

  // ========== Cart Management ==========
  const addToCart = useCallback(
    (product) => {
      setCartItems((prev) => {
        const existing = prev.find((item) => item.productId === product.id);

        if (existing) {
          const newQty = existing.quantity + 1;
          if (newQty > product.stockQuantity) {
            toast.error("Cannot exceed available stock");
            return prev;
          }

          return prev.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: newQty }
              : item,
          );
        }

        if (product.stockQuantity <= 0) {
          toast.error("Product out of stock");
          return prev;
        }

        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: 1,
            sellPrice: product.sellPrice || product.price,
            discountPercent: 0,
            taxPercent: 10, // Default tax
            lineTotal: product.sellPrice || product.price,
          },
        ];
      });

      toast.success(`${product.name} added to cart`);
      setActiveTab("cart");
    },
    [toast],
  );

  const updateCartItemQuantity = useCallback(
    (productId, newQuantity) => {
      setCartItems((prev) => {
        if (newQuantity <= 0) {
          return prev.filter((item) => item.productId !== productId);
        }

        const product = products.find((p) => p.id === productId);
        if (product && newQuantity > product.stockQuantity) {
          toast.error("Quantity exceeds available stock");
          return prev;
        }

        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: newQuantity }
            : item,
        );
      });
    },
    [products, toast],
  );

  const updateCartItemDiscount = useCallback((productId, discountPercent) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, discountPercent: Number(discountPercent) || 0 }
          : item,
      ),
    );
  }, []);

  const updateCartItemTax = useCallback((productId, taxPercent) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, taxPercent: Number(taxPercent) || 0 }
          : item,
      ),
    );
  }, []);

  const removeFromCart = useCallback(
    (productId) => {
      setCartItems((prev) =>
        prev.filter((item) => item.productId !== productId),
      );
      toast.success("Item removed from cart");
    },
    [toast],
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    setSelectedCustomer(null);
    setBillDiscountPercent(0);
    setPaidAmount(0);
    setPaymentMethod("CASH");
    generateBillNumber();
    toast.success("Cart cleared");
  }, [toast]);

  // ========== Calculations ==========
  useEffect(() => {
    if (cartItems.length === 0) {
      setTotals({
        subtotal: 0,
        itemDiscount: 0,
        afterItemDiscount: 0,
        cartDiscount: 0,
        taxAmount: 0,
        grandTotal: 0,
      });
      return;
    }

    let calculatedTotals = calculateCartTotals(cartItems);

    if (billDiscountPercent > 0) {
      calculatedTotals = applyBillDiscount(
        calculatedTotals,
        billDiscountPercent,
      );
    }

    // Update line totals in cart for display
    setCartItems((prev) =>
      prev.map((item) => {
        const lineSubtotal = item.quantity * item.sellPrice;
        const lineDiscount = lineSubtotal * (item.discountPercent / 100);
        const afterDiscount = lineSubtotal - lineDiscount;
        const lineTax = afterDiscount * (item.taxPercent / 100);
        const lineTotal = afterDiscount + lineTax;

        return {
          ...item,
          lineTotal: round(lineTotal),
        };
      }),
    );

    setTotals(calculatedTotals);
  }, [cartItems, billDiscountPercent]);

  // ========== Transaction Processing ==========
  const completeTransaction = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsProcessing(true);
    try {
      // Validate and process transaction
      const result = await billingService.completeTransaction({
        cartItems,
        customerId: selectedCustomer?.id || null,
        billNumber,
        subtotal: totals.subtotal,
        itemDiscount: totals.itemDiscount,
        cartDiscount: totals.cartDiscount,
        taxAmount: totals.taxAmount,
        grandTotal: totals.grandTotal,
        paidAmount: paidAmount || totals.grandTotal,
        paymentMethod,
        userId: user?.id,
        notes: "",
      });

      setTransactionResult({
        ...result,
        balance: calculateBalance(totals.grandTotal, paidAmount),
        customer: selectedCustomer,
      });

      setShowPaymentModal(false);
      setShowReceiptModal(true);
      toast.success("Transaction completed successfully!");

      // Clear cart after successful transaction
      setTimeout(() => {
        clearCart();
      }, 2000);
    } catch (err) {
      setError(`Transaction failed: ${err.message}`);
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ========== Filtered Products ==========
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku &&
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.barcode &&
        product.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" ||
      product.categoryId === Number(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // ========== Rendering ==========
  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <PageHeader
          title="Billing / POS"
          description="Point of sale interface"
        />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing / POS</h1>
            <p className="text-sm text-gray-500">
              Create bills and process payments
            </p>
          </div>
          <div className="text-right text-xs text-gray-500 space-y-1">
            <div>
              <kbd className="px-2 py-1 bg-gray-100 rounded">⌘/Ctrl</kbd> +{" "}
              <kbd className="px-2 py-1 bg-gray-100 rounded">Shift</kbd> +{" "}
              <kbd className="px-2 py-1 bg-gray-100 rounded">C</kbd> to complete
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gray-100 rounded">⌘/Ctrl</kbd> +{" "}
              <kbd className="px-2 py-1 bg-gray-100 rounded">K</kbd> to clear
              cart
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Left Panel - Products */}
        <div className="flex w-2/3 flex-col gap-4">
          {/* Search and Filters */}
          <Card>
            <div className="space-y-4 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, SKU, or barcode..."
                  icon={Search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === "all"
                      ? "bg-brand-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  All Products
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(String(category.id))}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      selectedCategory === String(category.id)
                        ? "bg-brand-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Product Grid */}
          <Card className="flex-1 overflow-y-auto p-4">
            {error ? (
              <ErrorState title="Error Loading Products" description={error} />
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No products found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or filters
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Panel - Cart & Billing */}
        <div className="flex w-1/3 flex-col gap-4 overflow-y-auto">
          {/* Cart Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">
                  {cartItems.length} Items
                </span>
              </div>
              {cartItems.length > 0 && (
                <Button size="sm" variant="ghost" onClick={clearCart}>
                  Clear
                </Button>
              )}
            </div>
          </Card>

          {/* Cart Items */}
          <Card className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-gray-500">
                <p>Add products to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.productId}
                    item={item}
                    onUpdateQuantity={updateCartItemQuantity}
                    onUpdateDiscount={updateCartItemDiscount}
                    onUpdateTax={updateCartItemTax}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Bill Calculations */}
          {cartItems.length > 0 && (
            <>
              <Card className="space-y-3 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(totals.subtotal)}
                    </span>
                  </div>
                  {totals.itemDiscount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Item Discount:</span>
                      <span>-{formatCurrency(totals.itemDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">
                      {formatCurrency(totals.taxAmount)}
                    </span>
                  </div>

                  {/* Bill Discount Input */}
                  <div className="border-t border-gray-200 pt-2">
                    <label className="block text-xs font-medium text-gray-600">
                      Bill Discount (%)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={billDiscountPercent}
                      onChange={(e) =>
                        setBillDiscountPercent(Number(e.target.value) || 0)
                      }
                      className="mt-1"
                    />
                    {totals.cartDiscount > 0 && (
                      <p className="mt-1 text-xs text-orange-600">
                        -{formatCurrency(totals.cartDiscount)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      Grand Total:
                    </span>
                    <span className="text-2xl font-bold text-brand-600">
                      {formatCurrency(totals.grandTotal)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Customer Selector */}
              <CustomerSelector
                selectedCustomer={selectedCustomer}
                onSelectCustomer={setSelectedCustomer}
              />

              {/* Payment Section */}
              <PaymentPanel
                grandTotal={totals.grandTotal}
                paidAmount={paidAmount}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                onPaidAmountChange={setPaidAmount}
                onCompleteTransaction={() => setShowPaymentModal(true)}
              />
            </>
          )}
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      <Modal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Complete Transaction"
        description={`Total: ${formatCurrency(totals.grandTotal)}`}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowPaymentModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={completeTransaction} loading={isProcessing}>
              Complete
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Paid Amount
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT">Credit</option>
            </select>
          </div>

          <div className="space-y-1 bg-gray-50 p-3 rounded-md text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Grand Total:</span>
              <span className="font-semibold">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid:</span>
              <span className="font-semibold">
                {formatCurrency(paidAmount)}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-1 flex justify-between">
              <span className="text-gray-600">Balance:</span>
              <span
                className={`font-semibold ${
                  calculateBalance(totals.grandTotal, paidAmount) >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(
                  calculateBalance(totals.grandTotal, paidAmount),
                )}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      {transactionResult && (
        <TransactionReceipt
          open={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setTransactionResult(null);
          }}
          transaction={transactionResult}
          cartItems={cartItems}
          totals={totals}
        />
      )}
    </div>
  );
}

/**
 * Product Card Component
 */
function ProductCard({ product, onAddToCart }) {
  const inStock = (product.stockQuantity || 0) > 0;

  return (
    <div
      className={`relative rounded-lg border-2 p-3 transition-all hover:shadow-md ${
        inStock
          ? "border-gray-200 bg-white hover:border-brand-300 cursor-pointer"
          : "border-red-200 bg-red-50 cursor-not-allowed opacity-60"
      }`}
      onClick={() => inStock && onAddToCart(product)}
    >
      {/* Product Image Placeholder */}
      <div className="mb-2 h-20 bg-gray-100 rounded-md flex items-center justify-center">
        <Package className="h-8 w-8 text-gray-400" />
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <h4 className="truncate text-sm font-medium text-gray-900">
          {product.name}
        </h4>
        <p className="text-xs text-gray-500">{product.sku}</p>
        <p className="text-sm font-semibold text-brand-600">
          {formatCurrency(product.sellPrice || product.price)}
        </p>

        {/* Stock Status */}
        <div className="flex items-center justify-between text-xs">
          <span
            className={
              inStock
                ? "text-emerald-600 font-medium"
                : "text-red-600 font-medium"
            }
          >
            {inStock ? `${product.stockQuantity} in stock` : "Out of stock"}
          </span>
          {inStock && <Plus className="h-3 w-3 text-brand-600" />}
        </div>
      </div>
    </div>
  );
}

/**
 * Cart Item Component
 */
function CartItem({
  item,
  onUpdateQuantity,
  onUpdateDiscount,
  onUpdateTax,
  onRemove,
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{item.productName}</h4>
          <p className="text-xs text-gray-500">{item.productSku}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          icon={Trash2}
          onClick={() => onRemove(item.productId)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <label className="block text-xs font-medium text-gray-600">Qty</label>
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={() =>
                onUpdateQuantity(item.productId, item.quantity - 1)
              }
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <Minus className="h-3 w-3" />
            </button>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) =>
                onUpdateQuantity(item.productId, Number(e.target.value) || 1)
              }
              className="w-10 border border-gray-300 rounded px-1 py-1 text-center text-xs"
            />
            <button
              onClick={() =>
                onUpdateQuantity(item.productId, item.quantity + 1)
              }
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600">
            Price
          </label>
          <div className="mt-1 text-xs font-semibold text-gray-900">
            {formatCurrency(item.sellPrice)}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600">
            Discount %
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={item.discountPercent}
            onChange={(e) =>
              onUpdateDiscount(item.productId, Number(e.target.value) || 0)
            }
            className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600">
            Tax %
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={item.taxPercent}
            onChange={(e) =>
              onUpdateTax(item.productId, Number(e.target.value) || 0)
            }
            className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-xs"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
        <span className="text-xs text-gray-600">Total:</span>
        <span className="font-semibold text-gray-900">
          {formatCurrency(item.lineTotal)}
        </span>
      </div>
    </div>
  );
}

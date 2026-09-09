import { useState } from "react";
import { Users, Plus } from "lucide-react";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import Modal from "../../../components/common/Modal";
import * as customerService from "../../../services/customerService";

/**
 * Customer Selector Component
 * Allows selection of:
 * - Walk-in customer (anonymous)
 * - Existing customer
 * - Create new customer
 */
export default function CustomerSelector({
  selectedCustomer,
  onSelectCustomer,
}) {
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const openModal = async () => {
    setShowModal(true);
    setIsLoading(true);
    try {
      const response = await customerService.getCustomers();
      setCustomers(response.data || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectWalkIn = () => {
    onSelectCustomer(null);
    setShowModal(false);
  };

  const selectCustomer = (customer) => {
    onSelectCustomer(customer);
    setShowModal(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerForm.name.trim()) {
      alert("Customer name is required");
      return;
    }

    try {
      const response = await customerService.createCustomer({
        ...newCustomerForm,
        address: "",
        city: "",
        state: "",
        postalCode: "",
        gstNumber: "",
      });

      selectCustomer(response.data);
      setNewCustomerForm({ name: "", phone: "", email: "" });
      setShowNewCustomerForm(false);
    } catch (err) {
      alert(`Failed to create customer: ${err.message}`);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <>
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-xs font-medium text-gray-600">Customer</p>
              <p className="font-semibold text-gray-900">
                {selectedCustomer ? selectedCustomer.name : "Walk-in Customer"}
              </p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={openModal}>
            Change
          </Button>
        </div>
      </Card>

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setShowNewCustomerForm(false);
        }}
        title="Select Customer"
        size="md"
      >
        <div className="space-y-4">
          {/* Walk-in Option */}
          <button
            onClick={selectWalkIn}
            className="w-full rounded-lg border-2 border-gray-200 p-3 text-left transition-all hover:border-brand-300 hover:bg-blue-50"
          >
            <p className="font-medium text-gray-900">Walk-in Customer</p>
            <p className="text-xs text-gray-500">Anonymous customer</p>
          </button>

          <div className="border-t border-gray-200 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Select Customer</h3>
              <Button
                size="sm"
                icon={Plus}
                onClick={() => setShowNewCustomerForm(true)}
              >
                New
              </Button>
            </div>

            {/* Search Customers */}
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3"
            />

            {/* Customer List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isLoading ? (
                <p className="text-center text-sm text-gray-500">
                  Loading customers...
                </p>
              ) : filteredCustomers.length === 0 ? (
                <p className="text-center text-sm text-gray-500">
                  No customers found
                </p>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="w-full rounded-lg border border-gray-200 p-3 text-left transition-all hover:border-brand-300 hover:bg-blue-50"
                  >
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">
                      {customer.phone || customer.email || "No contact info"}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* New Customer Form */}
          {showNewCustomerForm && (
            <div className="border-t border-gray-200 space-y-3 pt-4">
              <h3 className="font-semibold text-gray-900">
                Create New Customer
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Name
                </label>
                <Input
                  placeholder="Customer name"
                  value={newCustomerForm.name}
                  onChange={(e) =>
                    setNewCustomerForm({
                      ...newCustomerForm,
                      name: e.target.value,
                    })
                  }
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Phone
                </label>
                <Input
                  placeholder="Phone number"
                  value={newCustomerForm.phone}
                  onChange={(e) =>
                    setNewCustomerForm({
                      ...newCustomerForm,
                      phone: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Email
                </label>
                <Input
                  placeholder="Email"
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) =>
                    setNewCustomerForm({
                      ...newCustomerForm,
                      email: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowNewCustomerForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomer}>Create Customer</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

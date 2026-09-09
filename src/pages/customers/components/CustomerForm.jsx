import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../../../components/common/Modal";
import Input from "../../../components/common/Input";
import Textarea from "../../../components/common/Textarea";
import Button from "../../../components/common/Button";
import { useToast } from "../../../components/common/Toast";
import {
  createCustomer,
  updateCustomer,
} from "../../../services/customerService";
import { validators } from "../../../utils/validators";

/**
 * Customer Form Modal
 * Handles adding and editing customers
 */
export default function CustomerForm({ open, onClose, customer, onSuccess }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      gstNumber: "",
    },
  });

  // Prefill when editing (customer row already has full fields).
  useEffect(() => {
    if (!open) return;
    if (customer?.id) {
      reset({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        postalCode: customer.postalCode || "",
        gstNumber: customer.gstNumber || "",
      });
    } else {
      reset({
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        gstNumber: "",
      });
    }
  }, [open, customer, reset]);

  const onSubmit = async (formData) => {
    try {
      if (customer?.id) {
        await updateCustomer(customer.id, formData);
      } else {
        await createCustomer(formData);
      }
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to save customer: ${error.message}`);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? "Edit Customer" : "Add Customer"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {customer ? "Update" : "Create"} Customer
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <Input
          label="Customer Name *"
          placeholder="John Doe"
          {...register("name", {
            validate: validators.required(),
          })}
          error={errors.name?.message}
        />

        {/* Email */}
        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          {...register("email", {
            validate: validators.email(),
          })}
          error={errors.email?.message}
          hint="Optional - used for receipt sending"
        />

        {/* Phone */}
        <Input
          label="Phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          {...register("phone", {
            validate: validators.phone(),
          })}
          error={errors.phone?.message}
          hint="Optional - contact number"
        />

        {/* GST Number */}
        <Input
          label="GST Number"
          placeholder="18AABCU9603R1Z0"
          {...register("gstNumber")}
          error={errors.gstNumber?.message}
          hint="Optional - for B2B invoicing"
        />

        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-4">Address</h3>

          {/* Address */}
          <Textarea
            label="Street Address"
            placeholder="123 Main Street"
            rows={2}
            {...register("address")}
            error={errors.address?.message}
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* City */}
            <Input
              label="City"
              placeholder="New York"
              {...register("city")}
              error={errors.city?.message}
            />

            {/* State */}
            <Input
              label="State/Province"
              placeholder="NY"
              {...register("state")}
              error={errors.state?.message}
            />
          </div>

          {/* Postal Code */}
          <Input
            label="Postal Code"
            placeholder="10001"
            {...register("postalCode")}
            error={errors.postalCode?.message}
            className="mt-4"
          />
        </div>
      </form>
    </Modal>
  );
}

import { X } from "lucide-react"; // Optional: replace with any icon or plain text "×"

export default function OrderForm({ product, index, form, setForm }) {
  const handleRemoveProduct = () => {
    const updatedProducts = form.products.filter((_, i) => i !== index);
    setForm({ ...form, products: updatedProducts });
  };

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-blue-50 p-4 rounded items-end">
      {/* Product Name */}
      <input
        readOnly
        value={product.name}
        className="bg-gray-100 border p-2 rounded"
      />

      {/* Quantity */}
     {/* Quantity */}
<input
  type="number"
  min={1}
  placeholder="Qty"
  value={
    product.qty === undefined || product.qty === null
      ? ""
      : product.qty
  }
  onChange={(e) => {
    const updated = [...form.products];
    const value = e.target.value === "" ? "" : Number(e.target.value);
    updated[index].qty = value;
    setForm({ ...form, products: updated });
  }}
  className="border p-2 rounded"
  required
/>


      {/* Unit Cost */}
      <input
        type="number"
        min={0}
        value={
          product.costPerUnit !== undefined && product.costPerUnit !== null
            ? product.costPerUnit
            : ""
        }
        onChange={(e) => {
          const updated = [...form.products];
          const cost = e.target.value === "" ? "" : Number(e.target.value);
          updated[index].costPerUnit = cost;
          setForm({ ...form, products: updated });
        }}
        className="border p-2 rounded"
        required
      />

      {/* Total */}
      <div className="text-right font-medium pt-2">
        {Number(product.qty) && Number(product.costPerUnit)
          ? `₦${(
              Number(product.qty) * Number(product.costPerUnit)
            ).toLocaleString()}`
          : "₦0"}{" "}
      </div>

      {/* Remove Button */}
      <div className="flex justify-end">
        <button
          onClick={handleRemoveProduct}
          className="text-red-600 hover:text-red-800 text-xl font-bold"
          title="Remove product"
        >
          &times;
        </button>
      </div>
    </div>
      </>
  );
}

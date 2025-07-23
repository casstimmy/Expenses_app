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
  placeholder="quantity"
  value={
    product.quantity === undefined || product.quantity === null
      ? ""
      : product.quantity
  }
  onChange={(e) => {
    const updated = [...form.products];
    const value = e.target.value === "" ? "" : Number(e.target.value);
    updated[index].quantity = value;
    setForm({ ...form, products: updated });
  }}
  className="border p-2 rounded"
  required
/>


      {/* Unit Cost */}
 <input
  type="number"
  min={0}
  step="any" // <- Allows decimals like 0.01, 150.75 etc.
  value={
    product.costPrice !== undefined && product.costPrice !== null
      ? product.costPrice
      : ""
  }
  onChange={(e) => {
    const updated = [...form.products];
    const cost = e.target.value === "" ? "" : parseFloat(e.target.value);
    updated[index].costPrice = cost;
    setForm({ ...form, products: updated });
  }}
  className="border p-2 rounded"
  required
/>


      {/* Total */}
      <div className="text-right font-medium pt-2">
        {Number(product.quantity) && Number(product.costPrice)
          ? `₦${(
              Number(product.quantity) * Number(product.costPrice)
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
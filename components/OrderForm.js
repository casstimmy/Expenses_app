import { X } from "lucide-react"; // Optional: replace with any icon or plain text "×"

export default function OrderForm({ product, index, form, setForm }) {
  const handleRemoveProduct = () => {
    const updatedProducts = form.products.filter((_, i) => i !== index);
    setForm({ ...form, products: updatedProducts });
  };

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-blue-50 p-4 rounded items-end"
    >
      {/* Product Name */}
      <input
        readOnly
        value={product.name}
        className="bg-gray-100 border p-2 rounded"
      />

      {/* Quantity */}
      <input
        type="number"
        min={1}
        value={product.qty || 1}
        onChange={(e) => {
          const updated = [...form.products];
          updated[index].qty = Number(e.target.value);
          setForm({ ...form, products: updated });
        }}
        className="border p-2 rounded"
        required
      />

      {/* Unit Cost */}
      <input
        type="number"
        min={0}
        value={product.costPerUnit || 0}
        onChange={(e) => {
          const updated = [...form.products];
          updated[index].costPerUnit = Number(e.target.value);
          setForm({ ...form, products: updated });
        }}
        className="border p-2 rounded"
        required
      />

      {/* Total */}
      <div className="text-right font-medium pt-2">
        ₦
        {(Number(product.qty) * Number(product.costPerUnit)).toLocaleString()}
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
  );
}

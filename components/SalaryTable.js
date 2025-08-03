import React, { forwardRef } from "react";
import { useRouter } from "next/router";

const SalaryTable = forwardRef(({ staffList = [], currentStaff }, ref) => {
  const router = useRouter();

  // Calculate total penalties for a single staff
  const totalPenalties = (staff) =>
    staff.penalty?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  // Calculate total for the full list
  const totalAmount = staffList.reduce(
    (total, staff) =>
      total + ((Number(staff.salary) || 0) - totalPenalties(staff)),
    0
  );

  // Chunk staff list into groups of 5
  const chunkedStaff = [];
  for (let i = 0; i < staffList.length; i += 5) {
    chunkedStaff.push(staffList.slice(i, i + 5));
  }

  // Subtotal per chunk
  const calculateSubtotal = (staffChunk) =>
    staffChunk.reduce(
      (sum, staff) =>
        sum + ((Number(staff.salary) || 0) - totalPenalties(staff)),
      0
    );

  // View memo: store chunk in localStorage and navigate
  const handleViewMemo = (staffChunk, index) => {
  localStorage.setItem("staffPayroll", JSON.stringify(staffChunk));
  localStorage.setItem("payrollChunkIndex", index); // Store the index
  window.open("/memo/salary", "_blank");
};



  return (
    <div ref={ref} className="space-y-8 mt-4">
      {chunkedStaff.map((chunk, index) => {
        const chunkTotal = calculateSubtotal(chunk);

        return (
          <div key={index} className="space-y-2">
            {/* Salary Table */}
            <div className="overflow-x-auto rounded-lg shadow-md bg-white">
              <table className="min-w-full table-auto border-collapse text-sm">
                <thead className="bg-blue-100 font-bold text-gray-700">
                  <tr>
                    <th className="border-b px-4 py-3 text-left">Staff Name</th>
                    <th className="border-b px-4 py-3 text-left">Account Name</th>
                    <th className="border-b px-4 py-3 text-left">Bank Account</th>
                    <th className="border-b px-4 py-3 text-left">Bank Name</th>
                    {currentStaff?.role === "admin" && (
                      <th className="border-b px-4 py-3 text-left">Amount</th>
                    )}
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {chunk.map((staff) => (
                    <tr
                      key={staff._id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="border-b px-4 py-2">{staff.name}</td>
                      <td className="border-b px-4 py-2">
                        {staff.bank?.accountName || "N/A"}
                      </td>
                      <td className="border-b px-4 py-2">
                        {staff.bank?.accountNumber || "N/A"}
                      </td>
                      <td className="border-b px-4 py-2">
                        {staff.bank?.bankName || "N/A"}
                      </td>
                      {currentStaff?.role === "admin" && (
                        <td className="border-b px-4 py-2">
                          ₦
                          {Number(
                            (staff.salary || 0) - totalPenalties(staff)
                          ).toLocaleString()}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal & View Memo */}
               {currentStaff?.role === "admin" && (
            <div className="flex justify-between items-center p-3 bg-blue-50 border-t rounded-lg shadow-sm">
              <p className="text-blue-700 font-semibold">
                Subtotal: ₦{chunkTotal.toLocaleString()}
              </p>
             <button
  className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm cursor-pointer"
  onClick={() => handleViewMemo(chunk, index)} 
>
  View Memo
</button>

            </div>
               )}
          </div>
        );
      })}

      {/* T-Total */}
      {currentStaff?.role === "admin" && (
        <div className="flex justify-between text-blue-700 items-center p-4 bg-blue-100 border-t rounded-lg shadow font-bold">
          <p className="text-lg">T-Total</p>
          <p className="text-lg pr-10">₦{totalAmount.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
});

SalaryTable.displayName = "SalaryTable"; // ✅ Add this line

export default SalaryTable;

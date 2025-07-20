import React, { forwardRef } from "react";
import { toWords } from "number-to-words";


const PrintMemo = forwardRef(({ order, form, editing, handleChange }, ref) => {
  const amountInWords = `${toWords(form.amount).replace(/\b\w/g, (c) =>
    c.toUpperCase()
  )} Naira Only`;

  return (
        <div ref={ref} className="relative overflow-hidden bg-white w-[21cm] min-h-screen mt-5 mx-auto print:w-full">
        {/* Letterhead */}
        {/* Left color strip */}
        <div className="absolute top-0 left-0 h-full w-[1.5cm] bg-[#D5F3F6] z-0" />

        <div className="pl-22">
          <div className="absolute top-3 right-5 ">
            <img
              src="/image/LogoName.png"
              alt="Ibile Mart Logo"
              className="h-35 w-auto "
            />
          </div>

          <div className="pt-25">
            {/* Date and recipient */}
            <p className="mb-1 font-bold">
              {new Date(order.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              .
            </p>
            <p className="mb-1">The Branch Manager</p>
            <p className="mb-1">Access Bank Plc Oba</p>
            <p className="mb-4">
              Oniru Road Victoria Island
              <br />
              Lagos
            </p>

            {/* Subject */}
            <p className="mb-3 mt-8 font-semibold">Dear Sir,</p>
            <div className="flex flex-col place-items-center">
              <p className="mb-1 font-bold uppercase underline">
                ATTENTION: WILLIAMS CHEKE
              </p>
              <p className="mb-4 font-semibold ">TRANSFER REQUEST</p>
            </div>
            {/* Body */}
            <p className=" mr-4 mb-4">
              Please debit our account <strong>1239069143</strong> with{" "}
              <strong>₦{form.amount.toLocaleString()}</strong> (
              <em>{amountInWords}</em>) and transfer as follows:
            </p>

            {/* Editable account section */}
            <div className="my-12  space-y-2">
              {editing ? (
                <>
                  <p>
                    Account Name -{" "}
                    <input
                      className="border px-2 py-1 text-sm"
                      name="accountName"
                      value={form.accountName}
                      onChange={handleChange}
                    />
                  </p>
                  <p>
                    Account Number -{" "}
                    <input
                      className="border px-2 py-1 text-sm"
                      name="accountNumber"
                      value={form.accountNumber}
                      onChange={handleChange}
                    />
                  </p>
                  <p>
                    Bank Name -{" "}
                    <input
                      className="border px-2 py-1 text-sm"
                      name="bankName"
                      value={form.bankName}
                      onChange={handleChange}
                    />
                  </p>
                  <p>
                    Amount -{" "}
                    <input
                      className="border px-2 py-1 text-sm"
                      name="amount"
                      type="number"
                      value={form.amount}
                      onChange={handleChange}
                    />
                  </p>
                </>
              ) : (
                <>
                  {order.vendor && (
                    <div className="mt-2">
                      <p>Account Name: {order.vendor.accountName}</p>
                      <p>Account Number: {order.vendor.accountNumber}</p>
                      <p>Bank Name: {order.vendor.bankName}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="mb-20 font-bold">Thank you.</p>

            {/* Signature */}
            <p className="">Yours faithfully,</p>
            <p className="mb-15 ">
              For:{" "}
              <span className="font-semibold">
                Ibile Trading Resource Limited.
              </span>
            </p>
            <p className="mt-10 font-bold">Paul Farrer</p>
            <p className="font-bold ">Director</p>

            {/* Footer */}
            <div className="text-xs text-gray-700 mt-10 absolute bottom-4 right-5">
              <div className="flex flex-roll font-bold justify-end">
                <p>Ibile Trading Resources Ltd.</p>
                <span className="px-3">||</span>
                <p>Re 1s2414s</p>
              </div>
              <p>
                1, Garba Lawall Street, Off Ogombo Road, Abraham Adesanya, Ajah,
                Lagos.
              </p>
              <div className="flex flex-roll  justify-end">
                <p>
                  W:{" "}
                  <a href="https://ibilemart.com" className="underline">
                    ibilemart.com
                    <span className="pl-3">||</span>
                  </a>{" "}
                  &nbsp;&nbsp; E:{" "}
                  <a href="mailto:info@ibilemart.com" className="underline">
                    info@ibilemart.com
                    <span className="pl-3">||</span>
                  </a>{" "}
                  &nbsp;&nbsp; T: +234 803 240 5598
                </p>

                {/* Watermarks */}
                <div className="absolute ">
                  <img
                    src="/image/Logo.png"
                    alt="Watermark"
                    className="relative bottom-50 right-92 h-[28em] w-auto opacity-10 w-[300px] pointer-events-none z-0"
                  />
                </div>
                <div className="absolute ">
                  <img
                    src="/image/LogoWaterMark.png"
                    alt="Watermark"
                    className="relative rotate-330 bottom-140 left-95 h-[40rem] w-auto opacity-10 w-[300px] pointer-events-none z-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

  );
});

export default PrintMemo;

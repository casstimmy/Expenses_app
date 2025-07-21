import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef, forwardRef, useImperativeHandle } from "react";
import Image from "next/image";
import { toWords } from "number-to-words";

// Forwarding ref so parent component can access it
const PrintMemo = forwardRef(({ order, form, editing, handleChange, onDownloading }, ref) => {
  const memoRef = useRef();
  const today = new Date().toISOString().split("T")[0];
  const companyName = order.vendor.companyName;

  useImperativeHandle(ref, () => ({
    generatePDF: async () => {
      onDownloading(true); // Set button text to "Downloading..."
      const element = memoRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Transfer Instruction ${today} (From 9143 to ${companyName}).pdf`);
      onDownloading(false); // Revert button text to "Download PDF"
    },
  }));

  if (!order) return null;

  const amountInWords = `${toWords(form.amount).replace(/\b\w/g, (c) =>
    c.toUpperCase()
  )} Naira Only`;

  return (
    <div>
      <div
        ref={memoRef}
        style={{
          fontFamily: `"Segoe UI", "Helvetica Neue", "Arial", sans-serif`,
          backgroundColor: "#ffffff",
          color: "#000000",
          width: "21cm",
          height: "29.7cm",
          margin: "2rem auto",
          position: "relative",
          overflow: "hidden",
          paddingLeft: "2cm",
        }}
      >
        {/* Sidebar strip */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "1.5cm",
            backgroundColor: "#D5F3F6",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ position: "absolute", top: "0.8rem", right: "1rem" }}>
            <Image
              src="/image/LogoName.png"
              alt="Ibile Mart Logo"
              width={300}
              height={300}
              style={{ height: "10em", width: "auto" }}
            />
          </div>

          <div style={{ paddingTop: "5rem" }}>
            <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              {new Date(order.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              .
            </p>
            <p>The Branch Manager</p>
            <p>Access Bank Plc Oba</p>
            <p style={{ marginBottom: "1.5rem" }}>
              Oniru Road Victoria Island
              <br />
              Lagos
            </p>

            <p style={{ fontWeight: "600", marginBottom: "1rem", marginTop: "2rem" }}>Dear Sir,</p>

            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <p style={{ textDecoration: "underline", fontWeight: "bold" }}>
                ATTENTION: WILLIAMS CHEKE
              </p>
              <p style={{ fontWeight: "600" }}>TRANSFER REQUEST</p>
            </div>

            <p style={{ marginBottom: "1.5rem", paddingRight: "4em" }}>
              Please debit our account <strong>1239069143</strong> with{" "}
              <strong>₦{form.amount.toLocaleString()}</strong> (
              <em>{amountInWords}</em>) and transfer as follows:
            </p>

            <div>
              <div style={{ margin: "3rem 0" }}>
                {editing ? (
                  <>
                    <p>
                      Account Name -{" "}
                      <input
                        name="accountName"
                        value={form.accountName}
                        onChange={handleChange}
                        style={{ border: "1px solid black", padding: "4px", fontSize: "0.875rem" }}
                      />
                    </p>
                    <p>
                      Account Number -{" "}
                      <input
                        name="accountNumber"
                        value={form.accountNumber}
                        onChange={handleChange}
                        style={{ border: "1px solid black", padding: "4px", fontSize: "0.875rem" }}
                      />
                    </p>
                    <p>
                      Bank Name -{" "}
                      <input
                        name="bankName"
                        value={form.bankName}
                        onChange={handleChange}
                        style={{ border: "1px solid black", padding: "4px", fontSize: "0.875rem" }}
                      />
                    </p>
                    <p>
                      Amount -{" "}
                      <input
                        name="amount"
                        type="number"
                        value={form.amount}
                        onChange={handleChange}
                        style={{ border: "1px solid black", padding: "4px", fontSize: "0.875rem" }}
                      />
                    </p>
                  </>
                ) : (
                  order.vendor && (
                    <div>
                      <p>Account Name: {order.vendor.accountName}</p>
                      <p>Account Number: {order.vendor.accountNumber}</p>
                      <p>Bank Name: {order.vendor.bankName}</p>
                    </div>
                  )
                )}
              </div>

              <p style={{ fontWeight: "bold", marginBottom: "2rem", paddingTop: "7em" }}>Thank you.</p>

              <p>Yours faithfully,</p>
              <p style={{ marginBottom: "2rem" }}>
                For: <span style={{ fontWeight: "600" }}>Ibile Trading Resource Limited.</span>
              </p>
              <p style={{ fontWeight: "bold", paddingTop: "4em" }}>Paul Farrer</p>
              <p style={{ fontWeight: "bold" }}>Director</p>
            </div>

            {/* Footer */}
            <div
              style={{
                fontSize: "10px",
                color: "#444",
                position: "absolute",
                bottom: "-11.4rem",
                right: "1.2rem",
              }}
            >
              <div style={{ fontWeight: "bold", display: "flex", justifyContent: "flex-end" }}>
                <p>Ibile Trading Resources Ltd.</p>
                <span style={{ padding: "0 1rem" }}>||</span>
                <p>Re 1s2414s</p>
              </div>
              <p>1, Garba Lawall Street, Off Ogombo Road, Abraham Adesanya, Ajah, Lagos.</p>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <p>
                  W: <a href="https://ibilemart.com">ibilemart.com</a> ||
                  E: <a href="mailto:info@ibilemart.com">info@ibilemart.com</a> ||
                  T: +234 803 240 5598
                </p>
              </div>
            </div>

            {/* Watermarks */}
            <div style={{ position: "absolute", left: "-3em", bottom: "-23em", opacity: 0.1, zIndex: 0 }}>
              <Image
                src="/image/Logo.png"
                alt="Watermark"
                width={150}
                height={150}
                style={{ height: "28em", width: "auto" }}
              />
            </div>
            <div style={{ position: "absolute", right: "-22em", top: "20em", opacity: 0.1, zIndex: 0 }}>
              <Image
                src="/image/LogoWaterMark.png"
                alt="Watermark"
                width={50}
                height={50}
                style={{
                  height: "40rem",
                  width: "auto",
                  transform: "rotate(330deg)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ✅ Fix ESLint: assign display name to forwardRef component
PrintMemo.displayName = "PrintMemo";

export default PrintMemo;

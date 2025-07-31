import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef, forwardRef, useImperativeHandle, useState } from "react";
import { toWords } from "number-to-words";

const SalaryMemo = forwardRef(
  ({ staffList = [], onDownloading, selectedAccount, memoIndex  }, ref) => {
    const memoRef = useRef();
    const today = new Date().toISOString().split("T")[0];

    useImperativeHandle(ref, () => ({
      generatePDF: async () => {
        if (!memoRef.current) return;
        onDownloading(true);

        const canvas = await html2canvas(memoRef.current, {
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
        const pageNum = (memoIndex ?? 0) + 1;
        pdf.save(`Ibile Payroll ${today} Part${pageNum}.pdf`);
        onDownloading(false);
      },
    }));

    const groupInChunks = (arr, size) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
      );

    const chunkedStaff = groupInChunks(staffList, 5);

    return (
      <div>
        <div
          ref={memoRef}
          style={{
            fontFamily: `"Segoe UI", "Helvetica Neue", Arial, sans-serif`,
            backgroundColor: "#ffffff",
            color: "#000000",
            width: "21cm",
            minHeight: "29.7cm",
            margin: "2rem auto",
            position: "relative",
            overflow: "hidden",
            paddingLeft: "2cm",
            paddingRight: "1.5cm",
            fontSize: "13px", // Global default
          }}
        >
          {chunkedStaff.map((group, groupIndex) => {
            let totalChunk = 0;

            const processedGroup = group.map((staff) => {
              const netSalary =
                (staff.salary || 0) -
                (staff.penalty?.reduce((s, p) => s + (p.amount || 0), 0) || 0);
              totalChunk += netSalary;
              return { ...staff, netSalary };
            });

            return (
              <div key={groupIndex} style={{ pageBreakAfter: "always" }}>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: -10,
                    height: "100%",
                    width: "1.5cm",
                    backgroundColor: "#D5F3F6",
                    zIndex: 0,
                  }}
                />
                <div
                  style={{ position: "absolute", top: "1rem", right: "2rem" }}
                >
                  <img
                    src="/image/LogoName.png"
                    alt="Ibile Mart Logo"
                    style={{ height: "9em", width: "auto" }}
                  />
                </div>

                <div
                  style={{
                    paddingTop: "5.8rem",
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                    {new Date(today).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>

                  <p>The Branch Manager</p>
                  <p>Access Bank Plc</p>
                  <p style={{ marginBottom: "1.5rem" }}>
                    Oba Oniru Road
                    <br />
                    Victoria Island,
                    <br />
                    Lagos.
                  </p>

                  <p
                    style={{
                      fontWeight: "500",
                      marginBottom: "1.3rem",
                      marginTop: "2rem",
                      fontSize: "14px",
                    }}
                  >
                    Dear Sir,
                  </p>

                  <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <p
                      style={{
                        textDecoration: "underline",
                        fontWeight: "bold",
                        marginBottom: "0.5rem",
                        fontSize: "14px",
                      }}
                    >
                      ATTENTION: WILLIAMS CHEKE
                    </p>
                    <p style={{ fontWeight: "500", fontSize: "14px" }}>
                      WITHDRAWAL FROM OUR ACCOUNT{" "}
                      <strong>{selectedAccount}</strong> IBILE TRADING RESOURCES
                      LIMITED
                    </p>
                  </div>

                  <p style={{ marginBottom: "1.5rem" }}>
                    Please debit our account <strong>{selectedAccount}</strong>{" "}
                    with the sum of{" "}
                    <strong>₦{totalChunk.toLocaleString()}</strong>
                    <span className="px-1">
                      (
                      {toWords(totalChunk).replace(/\b\w/g, (c) =>
                        c.toUpperCase()
                      )}
                    </span>{" "}
                    Naira Only) with narration Salary for{" "}
                    {new Date().toLocaleString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    and transfer as follows:
                  </p>

                  {/* Staff Table */}
                  <table
                    style={{
                      fontSize: "13px",
                      width: "100%",
                      borderCollapse: "collapse",
                      marginBottom: "1rem",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor: "#f5f7fa",
                          textAlign: "left",
                        }}
                      >
                        <th style={{ ...th, fontSize: "14px" }}>S/N</th>
                        <th style={{ ...th, fontSize: "14px" }}>Staff Name</th>
                        <th style={{ ...th, fontSize: "14px" }}>
                          Account Name
                        </th>
                        <th style={{ ...th, fontSize: "14px" }}>
                          Account Number
                        </th>
                        <th style={{ ...th, fontSize: "14px" }}>Bank Name</th>
                        <th style={{ ...th, fontSize: "14px" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedGroup.map((staff, i) => (
                        <tr key={staff._id}>
                          <td style={td}>{groupIndex * 5 + i + 1}</td>
                          <td style={td}>{staff.name}</td>
                          <td style={td}>{staff.bank?.accountName || "N/A"}</td>
                          <td style={td}>
                            {staff.bank?.accountNumber || "N/A"}
                          </td>
                          <td style={td}>{staff.bank?.bankName || "N/A"}</td>
                          <td style={td}>
                            ₦{staff.netSalary.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      <tr
                        style={{
                          backgroundColor: "#f0f4f8",
                          borderTop: "2px solid #ddd",
                        }}
                      >
                        <td colSpan={5} style={{ ...td, fontWeight: "bold" }}>
                          Total
                        </td>
                        <td style={{ ...td, fontWeight: "bold" }}>
                          ₦{totalChunk.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-12">
                    <p>Yours faithfully,</p>
                    <p style={{ marginBottom: "2rem" }}>
                      For:{" "}
                      <span style={{ fontWeight: "600" }}>
                        Ibile Trading Resource Limited.
                      </span>
                    </p>
                    <p
                      style={{
                        fontWeight: "bold",
                        paddingTop: "3em",
                        fontSize: "14px",
                      }}
                    >
                      Paul Farrer
                    </p>
                    <p style={{ fontWeight: "bold", fontSize: "14px" }}>
                      Director
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    fontSize: "10px",
                    color: "#444",
                    position: "absolute",
                    bottom: "1.2rem",
                    right: "1.3rem",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <p>Ibile Trading Resources Ltd.</p>
                    <span style={{ padding: "0 1rem" }}>||</span>
                    <p>Re 1s2414s</p>
                  </div>
                  <p>
                    1, Garba Lawall Street, Off Ogombo Road, Abraham Adesanya,
                    Ajah, Lagos.
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <p>
                      W: <a href="https://ibilemart.com">ibilemart.com</a> || E:{" "}
                      <a href="mailto:info@ibilemart.com">info@ibilemart.com</a>{" "}
                      || T: +234 803 240 5598
                    </p>
                  </div>
                </div>

                {/* Watermarks */}
                <img
                  src="/image/LogoWaterMarkFull.png"
                  alt="WatermarkLeft"
                  style={{
                    position: "absolute",
                    left: "2em",
                    bottom: "-10em",
                    opacity: 0.1,
                    zIndex: 0,
                    height: "25em",
                    width: "auto",
                  }}
                />
                <img
                  src="/image/LogoWaterMark.png"
                  alt="WatermarkRight"
                  style={{
                    position: "absolute",
                    right: "-21em",
                    top: "20em",
                    opacity: 0.1,
                    zIndex: 0,
                    height: "40em",
                    width: "auto",
                    transform: "rotate(340deg)",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

const th = {
  borderBottom: "1px solid black",
  padding: "8px",
  textAlign: "left",
};

const td = {
  borderBottom: "1px solid #ccc",
  padding: "6px 8px",
  fontSize: "13px",
};

SalaryMemo.displayName = "SalaryMemo";
export default SalaryMemo;

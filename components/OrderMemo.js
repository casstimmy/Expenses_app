// components/MemoPDF.js
import React from "react";

export default function OrderMemo({ order }) {
  if (!order) return null;

  const today = new Date(order.createdAt).toISOString().split("T")[0];
  const vendor = order.vendor || {};

  return (
    <div
      style={{
        fontFamily: `"Segoe UI", "Helvetica Neue", Arial, sans-serif`,
        backgroundColor: "#ffffff",
        color: "#000000",
        width: "21cm",
        height: "29.7cm",
        margin: "0 auto",
        paddingLeft: "2cm",
        paddingRight: "1.5cm",
        fontSize: "13px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left color stripe */}
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

      {/* Header Logo */}
      <div style={{ position: "absolute", top: "1rem", right: "2rem" }}>
        <img
          src="/image/LogoName.png"
          alt="Ibile Mart Logo"
          style={{ height: "9em", width: "auto" }}
        />
      </div>

      {/* Main Content */}
      <div
        style={{
          paddingTop: "5.8rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontWeight: "500", fontSize: "14px" }}>
            ORDER MEMO FROM IBILE MART – ORDER #{order._id}
          </p>
        </div>

        <p style={{ marginBottom: "1.5rem" }}>
          Order details placed on{" "}
          <strong>
            {new Date(today).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </strong>
        </p>

        {/* Vendor Details */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "1rem",
            backgroundColor: "#f9f9f9",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
            Vendor Details:
          </p>
          <p>
            <strong>Name:</strong> {vendor.companyName || "N/A"}
          </p>
          <p>
            <strong>Phone:</strong> {vendor.repPhone || "N/A"}
          </p>
          <p>
            <strong>Product:</strong> {vendor.mainProduct || "N/A"}
          </p>
        </div>

        {/* Product Table */}
        <table
          style={{
            fontSize: "13px",
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "1rem",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f7fa", textAlign: "left" }}>
              <th style={th}>#</th>
              <th style={th}>Product</th>
              <th style={th}>Qty</th>
              <th style={th}>Price</th>
              <th style={th}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.products?.map((product, i) => (
              <tr key={i}>
                <td style={td}>{i + 1}</td>
                <td style={td}>{product.name}</td>
                <td style={td}>{product.quantity}</td>
                <td style={td}>₦{product.price.toLocaleString()}</td>
                <td style={td}>
                  ₦{(product.price * product.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
            <tr
              style={{
                backgroundColor: "#f0f4f8",
                borderTop: "2px solid #ddd",
              }}
            >
              <td colSpan={4} style={{ ...td, fontWeight: "bold" }}>
                Total
              </td>
              <td style={{ ...td, fontWeight: "bold" }}>
                ₦{order.grandTotal?.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
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
          <p>RC 1242145</p>
        </div>
        <p>
          1, Garba Lawall Street, Off Ogombo Road, Abraham Adesanya, Ajah,
          Lagos.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <p>
            W: <a href="https://ibilemart.com">ibilemart.com</a> || E:{" "}
            <a href="mailto:info@ibilemart.com">info@ibilemart.com</a> || T:
            +234 803 240 5598
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
}

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

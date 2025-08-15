// pages/api/web-products/upload.js
import multiparty from "multiparty";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import mime from "mime-types";
import { mongooseConnect } from "@/lib/mongoose";
import WebProduct from "@/models/WebProduct";

const S3BucketName = "image-bucket-admin";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const form = new multiparty.Form();

  try {
    const { files, fields } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
    });

    const client = new S3Client({
      region: "eu-west-2",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    const links = [];

    for (const file of files.file || []) {
      const fileType = file.originalFilename.split(".").pop();
      const imageFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileType}`;

      const fileBody = fs.readFileSync(file.path);

      await client.send(
        new PutObjectCommand({
          Bucket: S3BucketName,
          Key: imageFileName,
          Body: fileBody,
          ACL: "public-read",
          ContentType: mime.lookup(file.path) || "application/octet-stream",
        })
      );

      links.push(`https://${S3BucketName}.s3.amazonaws.com/${imageFileName}`);
    }

    // If productId is provided, push uploaded links to that product
    if (fields.productId && fields.productId[0]) {
      const productId = fields.productId[0];

      const updatedProduct = await WebProduct.findByIdAndUpdate(
        productId,
        { $push: { images: { $each: links } } },
        { new: true, runValidators: true }
      ).lean();

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Return normalized product
      const normalized = {
        _id: updatedProduct._id,
        name: updatedProduct.name,
        category: updatedProduct.category || "",
        price: updatedProduct.price,
        description: updatedProduct.description || "",
        images:
          (Array.isArray(updatedProduct.images) && updatedProduct.images.length > 0)
            ? updatedProduct.images
            : (updatedProduct.image ? [updatedProduct.image] : []),
      };

      return res.status(200).json({ message: "Upload successful", links, product: normalized });
    }

    // Otherwise, just return the links (for create flow)
    return res.status(200).json({ message: "Upload successful", links });
  } catch (error) {
    console.error("Upload API error:", error);
    return res.status(500).json({ message: "File upload failed", error: error.message });
  }
}

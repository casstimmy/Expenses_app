import multiparty from "multiparty";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import mime from "mime-types";
import sharp from "sharp";
import { requireAuth } from "@/lib/auth";

const S3BucketName = "image-bucket-admin";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const staff = await requireAuth(req, res);
  if (!staff) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const form = new multiparty.Form();

  try {
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) =>
        err ? reject(err) : resolve({ fields, files })
      );
    });

    const client = new S3Client({
      region: "eu-west-2",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    const links = [];
    const thumbnails = [];

    for (const file of files.file || []) {
      const baseName = file.originalFilename
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 60);
      const timestamp = Date.now();
      const key = `${baseName}-${timestamp}.webp`;
      const thumbKey = `thumb-${baseName}-${timestamp}.webp`;
      const body = fs.readFileSync(file.path);

      // Compress main image (max 1200px wide, 70% quality WebP)
      const compressedBuffer = await sharp(body)
        .resize(1200, null, { withoutEnlargement: true })
        .webp({ quality: 70 })
        .toBuffer();

      // Generate compressed thumbnail (300px wide, 60% quality WebP)
      const thumbBuffer = await sharp(body)
        .resize(300, null, { withoutEnlargement: true })
        .webp({ quality: 60 })
        .toBuffer();

      // Upload compressed original
      await client.send(
        new PutObjectCommand({
          Bucket: S3BucketName,
          Key: key,
          Body: compressedBuffer,
          ACL: "public-read",
          ContentType: "image/webp",
        })
      );

      // Upload thumbnail
      await client.send(
        new PutObjectCommand({
          Bucket: S3BucketName,
          Key: thumbKey,
          Body: thumbBuffer,
          ACL: "public-read",
          ContentType: "image/webp",
        })
      );

      links.push(`https://${S3BucketName}.s3.amazonaws.com/${key}`);
      thumbnails.push(`https://${S3BucketName}.s3.amazonaws.com/${thumbKey}`);
    }

    return res.status(200).json({ links, thumbnails });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Upload failed" });
  }
}

import multiparty from "multiparty";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import mime from "mime-types";
import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";

const S3BucketName = "image-bucket-admin";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const form = new multiparty.Form();

  try {
    const { files, fields } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) =>
        err ? reject(err) : resolve({ fields, files })
      );
    });

    // Validate by onboarding token
    const token = fields.token?.[0];
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    await mongooseConnect();
    const staff = await Staff.findOne({ onboardingToken: token });
    if (!staff) {
      return res.status(404).json({ message: "Invalid token" });
    }

    const client = new S3Client({
      region: "eu-west-2",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    const links = [];

    for (const file of files.file || []) {
      const ext = file.originalFilename.split(".").pop();
      const key = `staff/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const body = fs.readFileSync(file.path);

      await client.send(
        new PutObjectCommand({
          Bucket: S3BucketName,
          Key: key,
          Body: body,
          ACL: "public-read",
          ContentType: mime.lookup(file.path) || "application/octet-stream",
        })
      );

      links.push(`https://${S3BucketName}.s3.amazonaws.com/${key}`);
    }

    return res.status(200).json({ links });
  } catch (error) {
    console.error("Onboarding upload error:", error);
    return res.status(500).json({ message: "Upload failed" });
  }
}

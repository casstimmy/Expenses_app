import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";
import multiparty from "multiparty";
import fs from "fs";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const form = new multiparty.Form();
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) =>
        err ? reject(err) : resolve({ fields, files })
      );
    });

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const imageBytes = fs.readFileSync(file.path);

    const client = new RekognitionClient({
      region: "eu-west-2",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    const command = new DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MaxLabels: 5,
      MinConfidence: 60,
    });

    const result = await client.send(command);
    const labels = (result.Labels || []).map((l) => l.Name);

    // Pick the most specific label (usually the first non-generic one)
    const genericLabels = new Set([
      "Furniture", "Electronics", "Hardware", "Appliance",
      "Indoors", "Room", "Interior Design", "Home Decor",
    ]);
    const specific = labels.find((l) => !genericLabels.has(l)) || labels[0] || "";

    return res.status(200).json({ name: specific, labels });
  } catch (err) {
    console.error("Image identify error:", err.message);
    return res.status(200).json({ name: "", labels: [], error: err.message });
  }
}

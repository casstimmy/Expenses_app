import { formidable } from "formidable";
import fs from "fs";
import { Readable } from "stream";
import csvParser from "csv-parser";
import { mongooseConnect } from "@/lib/mongoose";
import WebProduct from "@/models/WebProduct";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await mongooseConnect();

  const form = formidable({ keepExtensions: true, multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ message: "Error parsing form", error: err });
    }

    const file = files.csvFile;
    if (!file) {
      return res.status(400).json({ message: "No file found in form data" });
    }

    const results = [];

    const stream = fs.createReadStream(file[0].filepath)
      .pipe(csvParser());

    stream.on("data", (data) => {
      results.push(data);
    });

    stream.on("end", async () => {
      try {
        const inserted = await WebProduct.insertMany(results);
        return res.status(200).json({ message: "CSV imported", count: inserted.length });
      } catch (err) {
        return res.status(500).json({ message: "DB insert failed", error: err.message });
      }
    });

    stream.on("error", (error) => {
      return res.status(500).json({ message: "CSV parsing failed", error: error.message });
    });
  });
}

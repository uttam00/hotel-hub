import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { runtime } from "../../../config";
import { requireUser, authzErrorResponse } from "@/lib/authz";

export { runtime };

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_PREFIXES = ["image/"];

export async function POST(req: NextRequest) {
  try {
    // Any logged-in user may upload (profile photo, hostel photo, ID proof),
    // but the endpoint may never be reachable anonymously — it writes to a
    // paid Cloudinary account with no other quota.
    await requireUser();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderName = (formData.get("folderName") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
      return NextResponse.json(
        { error: "Only image uploads are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File must be smaller than 10MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "auto", folder: folderName },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    const { secure_url, width, height } = result as any;

    return NextResponse.json({ url: secure_url, width, height });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

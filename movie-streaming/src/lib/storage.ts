import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

/** Image storage: Cloudinary when configured, otherwise the local public/uploads folder. */
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

const useCloudinary = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

/** Checks the real file signature, not just the declared type. */
function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.subarray(4, 12).toString().startsWith("ftypavi")) return "image/avif";
  return null;
}

export async function storeImage(file: File, folder: "posters" | "backdrops" | "avatars" | "stills") {
  if (file.size > MAX_BYTES) throw new Error("Image is larger than 8 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !TYPES[type]) throw new Error("Upload a JPG, PNG, WebP or AVIF image.");

  if (useCloudinary()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const res = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `nocturne/${folder}`, resource_type: "image" }, (err, out) =>
          err || !out ? reject(err ?? new Error("Upload failed")) : resolve(out),
        )
        .end(buf);
    });
    return res.secure_url;
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${TYPES[type]}`;
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${folder}/${name}`;
}

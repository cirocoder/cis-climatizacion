import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const directory = path.join(process.cwd(), "public", "images", "projects");
const files = fs.readdirSync(directory).filter((name) => name.endsWith(".webp")).sort();

for (const name of files) {
  const file = path.join(directory, name);
  const metadata = await sharp(file).metadata();
  console.log(JSON.stringify({
    name,
    bytes: fs.statSync(file).size,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    orientation: metadata.orientation ?? null,
    exif: Boolean(metadata.exif),
    icc: Boolean(metadata.icc),
    xmp: Boolean(metadata.xmp),
    iptc: Boolean(metadata.iptc),
    comments: Boolean(metadata.comments),
  }));
}
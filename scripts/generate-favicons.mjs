import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SVG_MASTER = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="104" fill="#FF5500" />
  <g transform="translate(64, 64) scale(16)" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="17" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
  </g>
</svg>
`.trim();

const SVG_MASKABLE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#FF5500" />
  <g transform="translate(100, 100) scale(13)" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="17" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
  </g>
</svg>
`.trim();

// Function to generate multi-resolution ICO file from PNG buffers
function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  let offset = 6 + count * 16;
  const dirEntries = [];

  for (const { width, height, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset of image data
    dirEntries.push(entry);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((p) => p.buffer)]);
}

async function main() {
  const publicDir = path.resolve(process.cwd(), 'public');
  const appDir = path.resolve(process.cwd(), 'app');

  // 1. Write SVG icons
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), SVG_MASTER);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), SVG_MASTER);

  // 2. Generate PNGs
  const masterSvgBuffer = Buffer.from(SVG_MASTER);
  const maskableSvgBuffer = Buffer.from(SVG_MASKABLE);

  const png16 = await sharp(masterSvgBuffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(masterSvgBuffer).resize(32, 32).png().toBuffer();
  const png48 = await sharp(masterSvgBuffer).resize(48, 48).png().toBuffer();
  const png180 = await sharp(masterSvgBuffer).resize(180, 180).png().toBuffer();
  const png192 = await sharp(masterSvgBuffer).resize(192, 192).png().toBuffer();
  const png512 = await sharp(masterSvgBuffer).resize(512, 512).png().toBuffer();

  const mask192 = await sharp(maskableSvgBuffer).resize(192, 192).png().toBuffer();
  const mask512 = await sharp(maskableSvgBuffer).resize(512, 512).png().toBuffer();

  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
  fs.writeFileSync(path.join(publicDir, 'favicon-48x48.png'), png48);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable-192.png'), mask192);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), mask512);

  // 3. Generate multi-resolution ICO file
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 },
  ]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);

  console.log('All favicon & media icons generated successfully!');
}

main().catch(console.error);

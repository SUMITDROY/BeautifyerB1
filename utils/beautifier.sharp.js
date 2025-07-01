import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM directory fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputDir = path.join(__dirname, 'public/images/beautified');

export default async function beautifyImage({ file, text }) {
  const { getHighlighter } = await import('shiki/core');

  const padding = 120;
  const fullWidth = 1000;
  const fullHeight = 600;

  await fs.mkdir(outputDir, { recursive: true });

  const baseName = file?.filename
    ? path.parse(file.filename).name
    : `code-${Date.now()}`;
  const pngFileName = baseName + '.png';
  const outputPath = path.join(outputDir, pngFileName);

  try {
    let imageBuffer;

    if (file) {
      const inputPath = file.path;
      const resizedImageBuffer = await sharp(inputPath)
        .resize({ width: 800, withoutEnlargement: true })
        .toBuffer();

      const { width, height } = await sharp(resizedImageBuffer).metadata();
      imageBuffer = {
        buffer: resizedImageBuffer,
        width,
        height,
      };
    } else if (text) {
      const highlighter = await getHighlighter({
        themes: ['nord'], // built-in VS Code-style theme
        defaultTheme: 'nord',
      });

      const html = highlighter.codeToHtml(text, {
        lang: 'javascript',
      });

      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${fullWidth - padding * 2}" height="${fullHeight - padding * 2}">
          <foreignObject width="100%" height="100%">
            <style>
              * { margin: 0; padding: 0; }
              pre.shiki {
                font-family: 'Fira Code', 'JetBrains Mono', Consolas, monospace;
                font-size: 24px;
                line-height: 1.6;
                background: transparent;
              }
            </style>
            ${html}
          </foreignObject>
        </svg>
      `;

      const textBuffer = await sharp(Buffer.from(svgContent)).png().toBuffer();

      imageBuffer = {
        buffer: textBuffer,
        width: fullWidth - padding * 2,
        height: fullHeight - padding * 2,
      };
    } else {
      throw new Error('No input file or text provided.');
    }

    const fullCanvasWidth = imageBuffer.width + padding * 2;
    const fullCanvasHeight = imageBuffer.height + padding * 2;

    const shadowBuffer = await sharp({
      create: {
        width: fullCanvasWidth,
        height: fullCanvasHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.3 },
      },
    })
      .blur(40)
      .png()
      .toBuffer();

    const glassSvg = `
      <svg width="${fullCanvasWidth}" height="${fullCanvasHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${fullCanvasWidth}" height="${fullCanvasHeight}" rx="40" ry="40"
              fill="rgba(255, 255, 255, 0.06)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="1"/>
        <circle cx="40" cy="40" r="10" fill="#FF5F57" />
        <circle cx="70" cy="40" r="10" fill="#FFBD2E" />
        <circle cx="100" cy="40" r="10" fill="#28C840" />
      </svg>
    `;

    const roundedCornersSvg = `
      <svg width="${fullCanvasWidth}" height="${fullCanvasHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="rounded">
            <rect width="100%" height="100%" rx="40" ry="40" fill="white"/>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="white" mask="url(#rounded)"/>
      </svg>
    `;

    await sharp({
      create: {
        width: fullCanvasWidth,
        height: fullCanvasHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: shadowBuffer, top: 0, left: 0, blend: 'dest-over' },
        { input: Buffer.from(glassSvg), blend: 'over' },
        { input: imageBuffer.buffer, top: padding, left: padding, blend: 'over' },
        { input: Buffer.from(roundedCornersSvg), blend: 'dest-in' },
      ])
      .png()
      .toFile(outputPath);

    return pngFileName;
  } catch (err) {
    console.error('Sharp or Shiki processing error:', err);
    throw err;
  }
}

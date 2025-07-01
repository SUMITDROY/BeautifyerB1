import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export default async function beautifyImage(file) {
  const inputPath = file.path;
  const fileName = file.filename;
  const outputDir = 'public/images/beautified';
  const baseName = path.parse(fileName).name;
  const pngFileName = baseName + '.png';
  const outputPath = path.join(outputDir, pngFileName);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {

    const resizedImageBuffer = await sharp(inputPath)
      .resize({ width: 800, withoutEnlargement: true })
      .toBuffer();

    const { width: imgWidth, height: imgHeight } = await sharp(resizedImageBuffer).metadata();

    const padding = 120;
    const fullWidth = imgWidth + padding * 2;
    const fullHeight = imgHeight + padding * 2;

    const shadowBuffer = await sharp({
      create: {
        width: fullWidth,
        height: fullHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.3 }
      }
    })
      .blur(40)
      .png()
      .toBuffer();


    const glassSvg = `
      <svg width="${fullWidth}" height="${fullHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${fullWidth}" height="${fullHeight}" rx="40" ry="40"
              fill="rgba(255, 255, 255, 0.06)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="1"/>

        <!-- Dots -->
        <circle cx="40" cy="40" r="10" fill="#FF5F57" />
        <circle cx="70" cy="40" r="10" fill="#FFBD2E" />
        <circle cx="100" cy="40" r="10" fill="#28C840" />
      </svg>
    `;


    const roundedCornersSvg = `
      <svg width="${fullWidth}" height="${fullHeight}" xmlns="http://www.w3.org/2000/svg">
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
        width: fullWidth,
        height: fullHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 } 
      }
    })
      .composite([
   
        { input: shadowBuffer, top: 0, left: 0, blend: 'dest-over' },

    
        { input: Buffer.from(glassSvg), blend: 'over' },

     
        { input: resizedImageBuffer, top: padding, left: padding, blend: 'over' },

    
        { input: Buffer.from(roundedCornersSvg), blend: 'dest-in' }
      ])
      .png()
      .toFile(outputPath);

    return pngFileName;

  } catch (error) {
    console.error('Sharp processing error:', error);
    throw error;
  }
}

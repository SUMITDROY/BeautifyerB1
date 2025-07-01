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
        // Step 1: Resize and pad the image
        const paddedBuffer = await sharp(inputPath)
            .resize({ width: 1000, withoutEnlargement: true })
            .extend({
                top: 120,
                bottom: 120,
                left: 120,
                right: 120,
                background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent
            })
            .png()
            .toBuffer();

        const { width, height } = await sharp(paddedBuffer).metadata();

        // Step 2: Create "glass" background — a white semi-transparent rectangle
        const glassSvg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="${width}" height="${height}" rx="40" ry="40"
                    fill="rgba(255, 255, 255, 0.07)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="1"/>
            </svg>
        `;

        // Step 3: Create a rounded corner mask
        const roundedMaskSvg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" rx="40" ry="40" fill="white"/>
            </svg>
        `;

        // Step 4: Glassy shadow (blurred dark box behind the image)
        const shadowBuffer = await sharp({
            create: {
                width,
                height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0.3 }
            }
        })
            .blur(10)
            .png()
            .toBuffer();

        // Step 5: Composite all together
        await sharp({
            create: {
                width,
                height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent base
            }
        })
            .composite([
                { input: shadowBuffer, top: 10, left: 10, blend: 'dest-over' },     // shadow
                { input: Buffer.from(glassSvg), blend: 'over' },                    // glass background
                { input: paddedBuffer, blend: 'over' },                             // actual image
                { input: Buffer.from(roundedMaskSvg), blend: 'dest-in' }            // rounded corners
            ])
            .png()
            .toFile(outputPath);

        return pngFileName;

    } catch (error) {
        console.error('Sharp processing error:', error);
        throw error;
    }
}

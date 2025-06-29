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

        const processedImage = sharp(inputPath)
            .resize({ width: 1000, withoutEnlargement: true })
            .extend({
                top: 80,
                bottom: 80,
                left: 100,
                right: 100,
                background: '#1e1e2f'
            });

        const { width, height } = await processedImage.metadata();

        const roundedCornersSvg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <mask id="rounded">
                        <rect width="100%" height="100%" fill="white" rx="30" ry="30"/>
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="white" mask="url(#rounded)"/>
            </svg>
        `;

        await processedImage
            .composite([
                {
                    input: Buffer.from(roundedCornersSvg),
                    blend: 'dest-in'
                }
            ])
            .png()
            .toFile(outputPath);

        return pngFileName;

    } catch (error) {
        console.error('Sharp processing error:', error);
        throw error;
    }
}
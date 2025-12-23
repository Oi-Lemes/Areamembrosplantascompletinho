
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const inputPath = path.resolve('frontend/src/app/icon.png');
const outputPath = path.resolve('frontend/src/app/icon.png');

async function processImage() {
    try {
        console.log(`Processing: ${inputPath}`);

        // STRATEGY: NEW IMAGE + ZOOM (60% Center Crop)
        // User asked to "change to this and zoom it". 
        // 0.60 keeps the center 60% (zooming in ~1.6x), cutting off 20% from each side.

        const tempStartBuffer = fs.readFileSync(inputPath); // Read fully into RAM first to close handle

        const metadata = await sharp(tempStartBuffer).metadata();
        const width = metadata.width;
        const height = metadata.height;

        const extractWidth = Math.floor(width * 0.60);
        const extractHeight = Math.floor(height * 0.60);
        const left = Math.floor((width - extractWidth) / 2);
        const top = Math.floor((height - extractHeight) / 2);

        const buffer = await sharp(tempStartBuffer)
            .extract({ left: left, top: top, width: extractWidth, height: extractHeight })
            .resize(32, 32, { fit: 'cover' })
            .toBuffer();

        fs.writeFileSync(outputPath, buffer); // Now safe to write back
        console.log('✅ Favicon processed: New Image + 60% Center Zoom!');
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

processImage();

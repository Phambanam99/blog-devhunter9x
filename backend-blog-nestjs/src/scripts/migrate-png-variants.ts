/**
 * Migration script to generate PNG variants (og, lg_png) for existing images.
 * 
 * === LOCAL DEVELOPMENT ===
 *   cd backend-blog-nestjs
 *   npx ts-node src/scripts/migrate-png-variants.ts
 * 
 * === DOCKER PRODUCTION ===
 *   # First, rebuild backend to include script
 *   docker compose build backend
 *   docker compose up -d backend
 *   
 *   # Then run migration inside container
 *   docker exec -it blog_backend node dist/src/scripts/migrate-png-variants.js
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Initialize Prisma with pg adapter (same as PrismaService)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Configuration - uses Docker environment variables
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
const MEDIA_URL = process.env.MEDIA_URL || '/uploads';

interface ImageVariants {
    [key: string]: string | undefined;
    sm?: string;
    md?: string;
    lg?: string;
    webp?: string;
    thumbnail?: string;
    sm_png?: string;
    md_png?: string;
    lg_png?: string;
    og?: string;
}

async function ensureDirectories() {
    const dirs = ['images/lg_png', 'images/og'];
    for (const dir of dirs) {
        const fullPath = path.join(UPLOAD_DIR, dir);
        try {
            await fs.access(fullPath);
        } catch {
            await fs.mkdir(fullPath, { recursive: true });
            console.log(`📁 Created directory: ${fullPath}`);
        }
    }
}

async function generatePngVariants(
    originalPath: string,
    baseName: string
): Promise<{ og?: string; lg_png?: string }> {
    const result: { og?: string; lg_png?: string } = {};

    try {
        const buffer = await fs.readFile(originalPath);
        const image = sharp(buffer);
        const metadata = await image.metadata();
        const width = metadata.width || 0;

        // Large PNG (1200px width)
        if (width > 1200) {
            const lgPngFilename = `${baseName}.png`;
            const lgPngPath = path.join(UPLOAD_DIR, 'images/lg_png', lgPngFilename);
            await sharp(buffer)
                .resize(1200, null, { withoutEnlargement: true })
                .png({ quality: 85, compressionLevel: 6 })
                .toFile(lgPngPath);
            result.lg_png = `${MEDIA_URL}/images/lg_png/${lgPngFilename}`;
        }

        // Open Graph optimized (1200x630)
        const ogFilename = `${baseName}.png`;
        const ogPath = path.join(UPLOAD_DIR, 'images/og', ogFilename);
        await sharp(buffer)
            .resize(1200, 630, { fit: 'cover', position: 'center' })
            .png({ quality: 85, compressionLevel: 6 })
            .toFile(ogPath);
        result.og = `${MEDIA_URL}/images/og/${ogFilename}`;

        return result;
    } catch (error) {
        console.error(`❌ Error processing ${originalPath}:`, error);
        return result;
    }
}

async function main() {
    console.log('🚀 Starting PNG variants migration...\n');

    // Ensure directories exist
    await ensureDirectories();

    // Get all image media
    const images = await prisma.media.findMany({
        where: { type: 'IMAGE' },
        select: {
            id: true,
            filename: true,
            url: true,
            variants: true,
        },
    });

    console.log(`📷 Found ${images.length} images to process\n`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const media of images) {
        const variants = (media.variants as ImageVariants) || {};

        // Skip if already has og variant
        if (variants.og) {
            console.log(`⏭️  Skipping ${media.filename} - already has og variant`);
            skipped++;
            continue;
        }

        const baseName = path.parse(media.filename).name;
        const originalPath = path.join(UPLOAD_DIR, 'images/original', media.filename);

        // Check if original file exists
        try {
            await fs.access(originalPath);
        } catch {
            console.log(`⚠️  Skipping ${media.filename} - original file not found`);
            skipped++;
            continue;
        }

        console.log(`🔄 Processing ${media.filename}...`);

        const newVariants = await generatePngVariants(originalPath, baseName);

        if (newVariants.og) {
            // Update database with new variants
            const updatedVariants: ImageVariants = {
                ...variants,
                ...newVariants,
            };

            await prisma.media.update({
                where: { id: media.id },
                data: { variants: updatedVariants },
            });

            console.log(`✅ Updated ${media.filename}`);
            processed++;
        } else {
            console.log(`❌ Failed to process ${media.filename}`);
            errors++;
        }
    }

    console.log('\n========== Migration Complete ==========');
    console.log(`✅ Processed: ${processed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('=========================================\n');

    await prisma.$disconnect();
    await pool.end();
}

main().catch(async (error) => {
    console.error('Migration failed:', error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
});

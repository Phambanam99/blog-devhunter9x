import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
    type: process.env.STORAGE_TYPE || 'local',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    mediaUrl: process.env.MEDIA_URL || '/uploads',
    // S3 config (optional)
    s3: {
        endpoint: process.env.S3_ENDPOINT,
        accessKey: process.env.S3_ACCESS_KEY,
        secretKey: process.env.S3_SECRET_KEY,
        bucket: process.env.S3_BUCKET,
        region: process.env.S3_REGION || 'us-east-1',
        cdnUrl: process.env.CDN_URL,
    },
    // Upload limits
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    allowedDocTypes: ['application/pdf'],
}));

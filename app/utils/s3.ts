import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Create an S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Bucket name from env
const bucketName = process.env.AWS_S3_BUCKET_NAME || "";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Upload a file to S3
export async function uploadFileToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
) {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
  };

  try {
    const command = new PutObjectCommand(params);
    const response = await s3Client.send(command);
    return { success: true, key: fileName, response };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    return { success: false, error };
  }
}

// Generate a pre-signed URL for file access
export async function generatePresignedUrl(
  s3Key: string,
  expiresIn: number = 3600
) {
  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
      expiresIn,
    });

    return { success: true, url: signedUrl };
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Delete a file from S3
export async function deleteFileFromS3(s3Key: string) {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    await s3Client.send(deleteCommand);
    return { success: true };
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// List all music files in the S3 bucket
export async function listMusicFiles() {
  const params = {
    Bucket: bucketName,
    Prefix: "", // You can specify a folder if needed
  };

  try {
    const command = new ListObjectsV2Command(params);
    const data = await s3Client.send(command);

    if (!data.Contents) {
      return [];
    }

    // Only include MP3 files
    const mp3Files = data.Contents.filter(
      (file) => file.Key && file.Key.toLowerCase().endsWith(".mp3")
    );

    // Generate signed URLs for each file that expire in 1 hour
    const filesWithUrls = await Promise.all(
      mp3Files.map(async (file) => {
        if (!file.Key) return null;

        const getObjectCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: file.Key,
        });

        const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
          expiresIn: 3600,
        });

        return {
          key: file.Key,
          name: file.Key.split("/").pop(),
          url: signedUrl,
          lastModified: file.LastModified,
          size: file.Size,
        };
      })
    );

    return filesWithUrls.filter(Boolean);
  } catch (error) {
    console.error("Error listing S3 files:", error);
    return [];
  }
}

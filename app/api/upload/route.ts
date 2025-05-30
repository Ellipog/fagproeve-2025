import { NextRequest, NextResponse } from "next/server";
import { uploadFileToS3 } from "@/app/utils/s3";
import { verifyToken } from "@/app/lib/auth";
import connectDB from "@/app/lib/mongodb";
import File from "@/app/models/File";
import { generateDummyAIMetadata } from "@/app/utils/aiMetadata";
import { analyzeDocument } from "@/app/lib/aiService";

// Accepted file types and their MIME types
const acceptedTypes = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "application/msword": [".doc"],
};

const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const isValidType =
    Object.keys(acceptedTypes).includes(file.type) ||
    Object.values(acceptedTypes)
      .flat()
      .some((ext) => file.name.toLowerCase().endsWith(ext));

  if (!isValidType) {
    return {
      isValid: false,
      error: `File "${file.name}" is not a supported format. Please upload PDF, DOC, images (PNG, JPG, GIF, WebP), or text files (TXT, MD) only.`,
    };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File "${file.name}" is too large. Maximum size is 10MB.`,
    };
  }

  return { isValid: true };
};

const getContentType = (file: File): string => {
  if (file.type) return file.type;

  // Fallback based on file extension
  const extension = file.name.toLowerCase().split(".").pop();
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "txt":
      return "text/plain";
    case "md":
      return "text/markdown";
    default:
      return "application/octet-stream";
  }
};

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Connect to MongoDB
    await connectDB();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadResults = [];
    const errors = [];

    for (const file of files) {
      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        errors.push(validation.error);
        continue;
      }

      try {
        // Get file buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Generate a unique filename with user ID
        const timestamp = new Date().getTime();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${decoded.userId}/${timestamp}-${safeName}`;

        // Get content type
        const contentType = getContentType(file);

        // Upload to S3
        const result = await uploadFileToS3(fileBuffer, fileName, contentType);

        if (result.success) {
          // AI Analysis Integration
          let aiMetadata;
          try {
            console.log(`Starting AI analysis for file: ${file.name}`);
            const aiAnalysis = await analyzeDocument(
              fileBuffer,
              file.name,
              contentType
            );

            aiMetadata = {
              category: aiAnalysis?.category,
              isCustomCategory: aiAnalysis?.isCustomCategory,
              tags: aiAnalysis?.tags,
              sensitiveData: aiAnalysis?.sensitiveData,
              sensitiveDataTags: aiAnalysis?.sensitiveDataTags,
              confidence: aiAnalysis?.confidence,
              language: aiAnalysis?.language,
              description: aiAnalysis?.description,
              aiName: aiAnalysis?.aiName,
              processingStatus: "completed" as const,
              lastAnalyzed: new Date(),
            };

            console.log(`AI analysis completed for ${file.name}:`, {
              category: aiAnalysis?.category,
              isCustomCategory: aiAnalysis?.isCustomCategory,
              tags: aiAnalysis?.tags,
              sensitiveData: aiAnalysis?.sensitiveData,
              sensitiveDataTags: aiAnalysis?.sensitiveDataTags,
              confidence: aiAnalysis?.confidence,
              description: aiAnalysis?.description,
              aiName: aiAnalysis?.aiName,
            });
          } catch (aiError) {
            console.warn(
              `AI analysis failed for ${file.name}, using fallback:`,
              aiError
            );
            // Fallback to dummy data if AI analysis fails
            aiMetadata = generateDummyAIMetadata(
              file.name,
              contentType,
              file.size
            );
            // Mark as failed processing
            aiMetadata.processingStatus = "failed";
          }

          // Save file metadata to MongoDB (without storing public URL)
          const fileDoc = new File({
            userId: decoded.userId,
            originalName: file.name,
            fileName,
            s3Key: result.key,
            // s3Url is omitted - we'll generate pre-signed URLs on demand
            size: file.size,
            mimeType: contentType,
            aiMetadata,
          });

          await fileDoc.save();

          uploadResults.push({
            id: fileDoc._id,
            originalName: file.name,
            fileName,
            s3Key: result.key,
            size: file.size,
            type: contentType,
            aiMetadata,
            uploadedAt: fileDoc.uploadedAt,
          });
        } else {
          errors.push(`Failed to upload ${file.name}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        errors.push(`Failed to process ${file.name}`);
      }
    }

    // Return results
    if (uploadResults.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: "All uploads failed", details: errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploadedFiles: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadResults.length} file(s)`,
    });
  } catch (error) {
    console.error("Error in upload route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

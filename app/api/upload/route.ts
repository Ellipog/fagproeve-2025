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

    // Define types for upload results
    interface UploadResult {
      id: string;
      originalName: string;
      fileName: string;
      s3Key: string;
      size: number;
      type: string;
      aiMetadata: AIMetadata;
      uploadedAt: Date;
    }

    interface AIMetadata {
      category?: string;
      isCustomCategory?: boolean;
      tags?: string[];
      sensitiveData?: boolean;
      sensitiveDataTags?: string[];
      confidence?: number;
      language?: string;
      description?: string;
      aiName?: string;
      processingStatus: "pending" | "completed" | "failed";
      lastAnalyzed: Date;
    }

    // Process files in parallel using Promise.allSettled
    const fileProcessingPromises = files.map(
      async (file): Promise<UploadResult> => {
        // Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
          throw new Error(validation.error || "File validation failed");
        }

        try {
          // Get file buffer
          const fileBuffer = Buffer.from(await file.arrayBuffer());

          // Generate a unique filename with user ID
          const timestamp = new Date().getTime();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const fileName = `${decoded.userId}/${timestamp}-${randomSuffix}-${safeName}`;

          // Get content type
          const contentType = getContentType(file);

          // Upload to S3
          const result = await uploadFileToS3(
            fileBuffer,
            fileName,
            contentType
          );

          if (!result.success) {
            const errorMessage =
              result.error instanceof Error
                ? result.error.message
                : typeof result.error === "string"
                ? result.error
                : "Upload failed";
            throw new Error(`Failed to upload ${file.name}: ${errorMessage}`);
          }

          // AI Analysis Integration
          let aiMetadata: AIMetadata;
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

          // Save file metadata to MongoDB
          const fileDoc = new File({
            userId: decoded.userId,
            originalName: file.name,
            fileName,
            s3Key: result.key,
            size: file.size,
            mimeType: contentType,
            aiMetadata,
          });

          await fileDoc.save();

          return {
            id: fileDoc._id,
            originalName: file.name,
            fileName,
            s3Key: result.key || "",
            size: file.size,
            type: contentType,
            aiMetadata,
            uploadedAt: fileDoc.uploadedAt,
          };
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to process ${file.name}: ${errorMessage}`);
        }
      }
    );

    // Wait for all file processing to complete (parallel execution)
    const results = await Promise.allSettled(fileProcessingPromises);

    // Separate successful uploads from errors
    const uploadResults: UploadResult[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        uploadResults.push(result.value);
      } else {
        const errorMessage =
          result.reason instanceof Error
            ? result.reason.message
            : `Failed to process file ${files[index].name}`;
        errors.push(errorMessage);
      }
    });

    // Return results
    if (uploadResults.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: "All uploads failed", details: errors },
        { status: 500 }
      );
    }

    const response = {
      success: true,
      uploadedFiles: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadResults.length} file(s)${
        errors.length > 0 ? ` (${errors.length} failed)` : ""
      }`,
    };

    console.log(
      `Upload completed: ${uploadResults.length} successful, ${errors.length} failed`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in upload route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";
import connectDB from "@/app/lib/mongodb";
import File from "@/app/models/File";
import { generatePresignedUrl } from "@/app/utils/s3";

export async function GET(request: NextRequest) {
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

    // Fetch all files for the user, sorted by upload date (newest first)
    const files = await File.find({ userId: decoded.userId })
      .sort({ uploadedAt: -1 })
      .lean();

    // Transform the data for frontend consumption and generate pre-signed URLs
    const transformedFiles = await Promise.all(
      files.map(async (file) => {
        // Generate pre-signed URL for each file (expires in 1 hour)
        const urlResult = await generatePresignedUrl(file.s3Key, 3600);

        return {
          id: file._id,
          originalName: file.originalName,
          fileName: file.fileName,
          url: urlResult.success ? urlResult.url : "",
          s3Key: file.s3Key,
          size: file.size,
          type: file.mimeType,
          aiMetadata: file.aiMetadata,
          uploadedAt: file.uploadedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      files: transformedFiles,
      count: transformedFiles.length,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

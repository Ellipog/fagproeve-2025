import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";
import connectDB from "@/app/lib/mongodb";
import File from "@/app/models/File";
import { deleteFileFromS3 } from "@/app/utils/s3";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before using
    const { id } = await params;

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

    // Find the file and verify ownership
    const file = await File.findOne({
      _id: id,
      userId: decoded.userId,
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    try {
      // Delete file from S3
      const s3DeleteResult = await deleteFileFromS3(file.s3Key);
      if (!s3DeleteResult.success) {
        console.warn(`Failed to delete file from S3: ${s3DeleteResult.error}`);
        // Continue with database deletion even if S3 deletion fails
      }
    } catch (s3Error) {
      console.warn("S3 deletion failed:", s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete file record from MongoDB
    await File.deleteOne({ _id: id, userId: decoded.userId });

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";
import connectDB from "@/app/lib/mongodb";
import File from "@/app/models/File";
import { generatePresignedUrl } from "@/app/utils/s3";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Find the file and verify ownership
    const file = await File.findOne({
      _id: params.id,
      userId: decoded.userId,
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Generate pre-signed URL (expires in 1 hour)
    const urlResult = await generatePresignedUrl(file.s3Key, 3600);

    if (!urlResult.success) {
      return NextResponse.json(
        { error: "Failed to generate access URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: urlResult.url,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error generating file URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

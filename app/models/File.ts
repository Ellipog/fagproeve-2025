import mongoose, { Document, Schema } from "mongoose";

export interface IFile extends Document {
  _id: string;
  userId: string;
  originalName: string;
  fileName: string;
  s3Key: string;
  s3Url?: string; // Optional since we generate pre-signed URLs on demand
  size: number;
  mimeType: string;
  // AI-generated metadata
  aiMetadata: {
    category: string;
    isCustomCategory: boolean;
    tags: string[];
    confidence: number;
    language: string;
    description: string; // Norwegian description of the document
    aiName: string; // AI-generated descriptive name
    processingStatus: "pending" | "completed" | "failed";
    lastAnalyzed: Date;
  };
  uploadedAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true, // Index for faster queries by user
    },
    originalName: {
      type: String,
      required: [true, "Original filename is required"],
    },
    fileName: {
      type: String,
      required: [true, "Generated filename is required"],
    },
    s3Key: {
      type: String,
      required: [true, "S3 key is required"],
      unique: true,
    },
    s3Url: {
      type: String,
      required: false, // Not required since we generate pre-signed URLs on demand
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
    },
    aiMetadata: {
      category: {
        type: String,
        required: true,
      },
      isCustomCategory: {
        type: Boolean,
        required: true,
        default: false,
      },
      tags: [
        {
          type: String,
        },
      ],
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      language: {
        type: String,
        required: true,
        default: "no", // Default to Norwegian
      },
      description: {
        type: String,
        required: true,
        default: "Dokument uten beskrivelse",
      },
      aiName: {
        type: String,
        required: true,
        default: "Dokument",
      },
      processingStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        required: true,
        default: "pending",
      },
      lastAnalyzed: {
        type: Date,
        required: true,
        default: Date.now,
      },
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient user file queries
fileSchema.index({ userId: 1, uploadedAt: -1 });

// Index for category-based queries
fileSchema.index({ userId: 1, "aiMetadata.category": 1 });

// Index for tag-based queries
fileSchema.index({ userId: 1, "aiMetadata.tags": 1 });

const File = mongoose.models.File || mongoose.model<IFile>("File", fileSchema);

export default File;

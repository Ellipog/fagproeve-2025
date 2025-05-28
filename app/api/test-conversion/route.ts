import { NextRequest, NextResponse } from "next/server";
import { convertDocumentToImage } from "@/app/utils/documentToImage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "pdf";

    let sampleBuffer: Buffer;
    let fileName: string;
    let mimeType: string;

    // Create sample content based on type
    switch (type) {
      case "pdf":
        // For PDFs, we now return the original buffer since OpenAI supports them natively
        sampleBuffer = Buffer.from(
          "Sample PDF content - now handled natively by OpenAI"
        );
        fileName = "sample-document.pdf";
        mimeType = "application/pdf";

        // Return a message explaining the change
        return NextResponse.json(
          {
            message:
              "PDF files are now handled natively by OpenAI and no longer converted to images",
            fileName,
            mimeType,
            note: "This PDF would be sent directly to OpenAI for analysis",
          },
          { status: 200 }
        );

      case "doc":
        sampleBuffer = Buffer.from("Sample DOC content for testing conversion");
        fileName = "sample-document.doc";
        mimeType = "application/msword";
        break;

      case "txt":
        sampleBuffer = Buffer.from(`Sample Text Document

This is a sample text file that demonstrates how text files are converted to images.

Key features:
- Line wrapping
- Proper spacing
- File metadata display
- Clean formatting

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

This text will be wrapped properly and displayed in a readable format when converted to an image.`);
        fileName = "sample-document.txt";
        mimeType = "text/plain";
        break;

      case "md":
        sampleBuffer = Buffer.from(`# Sample Markdown Document

This is a **sample markdown file** that demonstrates how markdown files are converted to images.

## Features

- *Italic text*
- **Bold text**
- Lists and formatting
- Code blocks

\`\`\`javascript
function example() {
  console.log("This is sample code");
}
\`\`\`

### Additional Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. This markdown content will be rendered as plain text in the image conversion process.

> This is a blockquote example

1. First item
2. Second item
3. Third item`);
        fileName = "sample-document.md";
        mimeType = "text/markdown";
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type. Use: pdf, doc, txt, or md" },
          { status: 400 }
        );
    }

    console.log(`Processing sample ${type} file...`);

    // Process the sample document
    const result = await convertDocumentToImage(
      sampleBuffer,
      fileName,
      mimeType
    );

    // Return the image
    return new NextResponse(result as Buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="converted-${fileName}.png"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Error in test conversion:", error);
    return NextResponse.json(
      {
        error: "Processing failed",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`Processing uploaded file: ${file.name} (${file.type})`);

    // Get file buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    if (file.type === "application/pdf") {
      // For PDFs, return information about native handling
      return NextResponse.json(
        {
          message: "PDF files are now handled natively by OpenAI",
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          note: "This PDF would be sent directly to OpenAI for analysis without conversion",
        },
        { status: 200 }
      );
    }

    // Process non-PDF files
    const result = await convertDocumentToImage(
      fileBuffer,
      file.name,
      file.type
    );

    // Return the converted image
    return new NextResponse(result as Buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="converted-${file.name}.png"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Error processing uploaded file:", error);
    return NextResponse.json(
      {
        error: "Processing failed",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

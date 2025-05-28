import { createCanvas } from "canvas";

/**
 * Convert text files to image using Canvas - improved version matching client-side
 */
export async function convertTextToImage(
  textBuffer: Buffer,
  fileName: string
): Promise<Buffer> {
  try {
    console.log("Starting text to image conversion using Canvas");

    const text = textBuffer.toString("utf-8");

    // Canvas settings - matching client-side implementation
    const fontSize = 16;
    const lineHeight = fontSize * 1.2;
    const padding = 20;
    const maxWidth = 800;

    // Create temporary canvas to measure text
    const tempCanvas = createCanvas(maxWidth, 100);
    const tempContext = tempCanvas.getContext("2d");
    tempContext.font = `${fontSize}px Arial`;

    // Split text into words and wrap lines properly
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = tempContext.measureText(testLine);

      if (metrics.width > maxWidth - padding * 2 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    // Calculate final canvas dimensions
    const canvasWidth = maxWidth;
    const canvasHeight = lines.length * lineHeight + padding * 2;

    // Create final canvas
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext("2d");

    // Set background
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Set text style
    context.fillStyle = "black";
    context.font = `${fontSize}px Arial`;
    context.textBaseline = "top";

    // Draw text content
    lines.forEach((line, i) => {
      context.fillText(line, padding, padding + i * lineHeight);
    });

    const imageBuffer = canvas.toBuffer("image/png", { compressionLevel: 6 });
    console.log("Text to image conversion completed successfully");
    return imageBuffer;
  } catch (error: any) {
    console.error("Error converting text to image:", error);
    throw new Error(
      `Text to image conversion failed: ${error?.message || "Unknown error"}`
    );
  }
}

/**
 * Main function to convert documents to image or return original buffer for PDFs
 * Updated to support OpenAI's native PDF handling
 */
export async function convertDocumentToImage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<Buffer | Buffer[]> {
  try {
    console.log(`Processing document: ${fileName} (${mimeType})`);

    if (mimeType === "application/pdf") {
      // OpenAI now supports PDF files directly - return original buffer
      console.log(
        "PDF file detected - returning original buffer for OpenAI processing"
      );
      return fileBuffer;
    } else if (mimeType.startsWith("image/")) {
      // Already an image, return as-is
      return fileBuffer;
    } else if (
      mimeType === "text/plain" ||
      mimeType === "text/csv" ||
      mimeType === "text/markdown" ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".csv") ||
      fileName.endsWith(".md")
    ) {
      return await convertTextToImage(fileBuffer, fileName);
    } else {
      throw new Error(
        `Unsupported file type for conversion: ${mimeType}. Supported types: PDF (native OpenAI support), images (JPEG, PNG, GIF, WebP), text files, CSV, and Markdown.`
      );
    }
  } catch (error: any) {
    console.error("Document processing failed:", error);
    throw error;
  }
}

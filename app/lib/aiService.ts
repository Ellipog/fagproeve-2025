import { OpenAI } from "openai";
import {
  PREDEFINED_CATEGORIES,
  PREDEFINED_TAGS,
  CUSTOM_CATEGORY_PREFIX,
  DEFAULT_CONFIDENCE_THRESHOLD,
} from "./constants";
import { convertDocumentToImage } from "@/app/utils/documentToImage";

// AI Analysis Result Interface
export interface AIAnalysisResult {
  category: string;
  isCustomCategory: boolean;
  tags: string[];
  confidence: number;
  language: string;
  description: string;
  aiName: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Analyze PDF directly with OpenAI's native PDF support
async function analyzePdfDirectly(
  pdfBuffer: Buffer,
  fileName: string
): Promise<AIAnalysisResult> {
  try {
    console.log("Analyzing PDF directly with OpenAI's native PDF support");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create the analysis prompt
    const prompt = `Analyser dette PDF-dokumentet og kategoriser det. Returner resultatet som JSON med følgende struktur:

{
  "category": "kategori fra listen eller CUSTOM_[navn] for nye kategorier",
  "isCustomCategory": false/true,
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85,
  "language": "no/en/unknown",
  "description": "kort beskrivelse på norsk",
  "aiName": "kort navn"
}

Tilgjengelige kategorier: ${PREDEFINED_CATEGORIES.join(", ")}
Tilgjengelige tags: ${PREDEFINED_TAGS.join(", ")}

Retningslinjer:
- Bruk eksisterende kategorier når mulig, ellers lag ny med CUSTOM_ prefix
- Velg 3-5 relevante tags
- Confidence skal være mellom 0 og 1
- Language skal være "no" for norsk, "en" for engelsk, eller "unknown"
- Description skal være en kort, informativ beskrivelse på norsk (maks 100 ord)
- aiName skal være SUPER KORT - maks 3 ord, helst 1-2 ord (f.eks. "Pass", "Kontrakt", "Vitnemål", "Lønnslipp")
`;

    // Upload the PDF file to OpenAI
    console.log("Uploading PDF file to OpenAI...");
    const file = await openai.files.create({
      file: new File([pdfBuffer], fileName, { type: "application/pdf" }),
      purpose: "user_data",
    });

    console.log(`PDF uploaded with file ID: ${file.id}`);

    // Create chat completion with file reference
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              file: {
                file_id: file.id,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.1, // Low temperature for consistent categorization
    });

    // Clean up: delete the uploaded file
    try {
      await openai.files.del(file.id);
      console.log(`Cleaned up uploaded file: ${file.id}`);
    } catch (cleanupError) {
      console.warn("Failed to cleanup uploaded file:", cleanupError);
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]) as AIAnalysisResult;

    // Validate and sanitize the result
    return validateAndSanitizeResult(result);
  } catch (error) {
    console.error("Error in direct PDF analysis:", error);
    throw error;
  }
}

// GPT-4o Mini analysis function
async function analyzeImageWithGPT4oMini(
  imageBuffer: Buffer,
  fileName: string
): Promise<AIAnalysisResult> {
  try {
    console.log("Analyzing image with GPT-4o Mini");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Determine image MIME type
    const mimeType =
      imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50
        ? "image/png"
        : "image/jpeg";

    // Convert image to base64
    const base64Image = imageBuffer.toString("base64");

    // Create the analysis prompt
    const prompt = `Analyser dette bildet/dokumentet og kategoriser det. Returner resultatet som JSON med følgende struktur:

{
  "category": "kategori fra listen eller CUSTOM_[navn] for nye kategorier",
  "isCustomCategory": false/true,
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85,
  "language": "no/en/unknown",
  "description": "kort beskrivelse på norsk",
  "aiName": "kort navn"
}

Tilgjengelige kategorier: ${PREDEFINED_CATEGORIES.join(", ")}
Tilgjengelige tags: ${PREDEFINED_TAGS.join(", ")}

Retningslinjer:
- Bruk eksisterende kategorier når mulig, ellers lag ny med CUSTOM_ prefix
- Velg 3-5 relevante tags
- Confidence skal være mellom 0 og 1
- Language skal være "no" for norsk, "en" for engelsk, eller "unknown"
- Description skal være en kort, informativ beskrivelse på norsk (maks 100 ord)
- aiName skal være SUPER KORT - maks 3 ord, helst 1-2 ord (f.eks. "Pass", "Kontrakt", "Vitnemål", "Lønnslipp")
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.1, // Low temperature for consistent categorization
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]) as AIAnalysisResult;

    // Validate and sanitize the result
    return validateAndSanitizeResult(result);
  } catch (error) {
    console.error("Error in GPT-4o Mini analysis:", error);
    throw error;
  }
}

// Validate and sanitize AI analysis result
function validateAndSanitizeResult(result: AIAnalysisResult): AIAnalysisResult {
  // Ensure all required fields are present and valid
  const sanitized: AIAnalysisResult = {
    category: result.category || "Offentlig dokument",
    isCustomCategory: Boolean(result.isCustomCategory),
    tags: Array.isArray(result.tags) ? result.tags.slice(0, 10) : ["dokument"],
    confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.5)),
    language: result.language || "no",
    description: result.description || "Dokument lastet opp til systemet",
    aiName: result.aiName || "Dokument",
  };

  // Validate category
  if (sanitized.category.startsWith("CUSTOM_")) {
    sanitized.isCustomCategory = true;
  }

  // Ensure aiName is super short (max 3 words)
  if (sanitized.aiName) {
    const words = sanitized.aiName.trim().split(/\s+/);
    if (words.length > 3) {
      sanitized.aiName = words.slice(0, 3).join(" ");
    }
  }

  // Ensure tags are strings and not empty
  sanitized.tags = sanitized.tags
    .filter((tag) => typeof tag === "string" && tag.trim().length > 0)
    .map((tag) => tag.trim().toLowerCase())
    .slice(0, 10);

  if (sanitized.tags.length === 0) {
    sanitized.tags = ["dokument"];
  }

  return sanitized;
}

// Fallback analysis for when AI fails
function analyzeWithFallback(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): AIAnalysisResult {
  console.log("Using fallback analysis for:", fileName);

  // Basic categorization based on file type and name
  let category = "Offentlig dokument";
  let description = "Dokument lastet opp til systemet";
  let aiName =
    fileName.replace(/\.[^/.]+$/, "").split(/[-_\s]+/)[0] || "Dokument"; // Take first word only
  const lowerFileName = fileName.toLowerCase();

  // Simple keyword-based categorization
  if (lowerFileName.includes("pass") || lowerFileName.includes("passport")) {
    category = "Pass";
    description = "Passdokument for identifikasjon";
    aiName = "Pass";
  } else if (
    lowerFileName.includes("kontrakt") ||
    lowerFileName.includes("contract")
  ) {
    category = "Arbeidskontrakt";
    description = "Arbeidskontrakt eller ansettelsesavtale";
    aiName = "Kontrakt";
  } else if (lowerFileName.includes("attest")) {
    category = "Bostedsattest";
    description = "Attest som bekrefter bostedsadresse";
    aiName = "Attest";
  } else if (
    lowerFileName.includes("vitnemål") ||
    lowerFileName.includes("diploma")
  ) {
    category = "Vitnemål";
    description = "Utdanningsvitnemål eller diplom";
    aiName = "Vitnemål";
  } else if (
    lowerFileName.includes("lønn") ||
    lowerFileName.includes("salary")
  ) {
    category = "Lønnslipp";
    description = "Lønnslipp som viser inntekt";
    aiName = "Lønnslipp";
  } else if (lowerFileName.includes("bank")) {
    category = "Bankkontoutskrift";
    description = "Kontoutskrift fra bank";
    aiName = "Kontoutskrift";
  } else if (
    lowerFileName.includes("helse") ||
    lowerFileName.includes("health")
  ) {
    category = "Helseattest";
    description = "Helseattest eller medisinsk dokumentasjon";
    aiName = "Helseattest";
  }

  // Basic tags based on file type
  const tags: string[] = [];
  if (mimeType.startsWith("image/")) {
    tags.push("bilde");
  } else if (mimeType === "application/pdf") {
    tags.push("pdf", "dokument");
  }

  return {
    category,
    isCustomCategory: false,
    tags,
    confidence: 0.5, // Low confidence for fallback
    language: "no",
    description,
    aiName,
  };
}

// Main document analysis function
export async function analyzeDocument(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<AIAnalysisResult> {
  try {
    console.log(`Starting document analysis for: ${fileName} (${mimeType})`);

    if (mimeType === "application/pdf") {
      // Use OpenAI's native PDF support
      console.log("PDF detected - using OpenAI's native PDF analysis");
      return await analyzePdfDirectly(fileBuffer, fileName);
    }

    // For non-PDF files, convert to image first
    const imageResult = await convertDocumentToImage(
      fileBuffer,
      fileName,
      mimeType
    );

    console.log(
      "Document converted to image successfully, analyzing with GPT-4o Mini"
    );

    // Handle single image (text files, images, etc.)
    const imageBuffer = imageResult as Buffer;

    // Analyze image with GPT-4o Mini
    return await analyzeImageWithGPT4oMini(imageBuffer, fileName);
  } catch (error) {
    console.warn("Document analysis failed, using fallback:", error);
    // Fallback: Basic rule-based analysis
    return analyzeWithFallback(fileBuffer, fileName, mimeType);
  }
}

// Dummy AI metadata generator
// This will be replaced with actual AI scanning in the future

export interface AIMetadata {
  description: string;
  tags: string[];
  category: string;
  confidence: number;
  extractedText?: string;
  language?: string;
}

const documentCategories = [
  "Business Document",
  "Personal Document",
  "Educational Material",
  "Legal Document",
  "Financial Document",
  "Technical Documentation",
  "Creative Content",
  "Reference Material",
];

const commonTags = {
  pdf: ["document", "text", "formal", "printable"],
  docx: ["document", "editable", "text", "word-processing"],
  image: ["visual", "graphic", "picture", "media"],
  jpeg: ["photo", "image", "visual", "compressed"],
  png: ["image", "graphic", "transparent", "web-ready"],
};

const sampleDescriptions = [
  "A well-structured document containing important information",
  "Professional document with clear formatting and content",
  "Detailed document with comprehensive information",
  "Informative content with organized structure",
  "Document containing valuable data and insights",
  "Well-formatted file with relevant information",
  "Comprehensive document with detailed content",
  "Professional file with structured information",
];

export function generateDummyAIMetadata(
  fileName: string,
  mimeType: string,
  fileSize: number
): AIMetadata {
  // Determine file type for category and tags
  const isImage = mimeType.startsWith("image/");
  const isPDF = mimeType === "application/pdf";
  const isDocx = mimeType.includes("wordprocessingml");

  // Generate category
  const category =
    documentCategories[Math.floor(Math.random() * documentCategories.length)];

  // Generate tags based on file type
  let tags: string[] = [];
  if (isImage) {
    tags = [...commonTags.image];
    if (mimeType === "image/jpeg") tags.push(...commonTags.jpeg);
    if (mimeType === "image/png") tags.push(...commonTags.png);
  } else if (isPDF) {
    tags = [...commonTags.pdf];
  } else if (isDocx) {
    tags = [...commonTags.docx];
  }

  // Add size-based tags
  if (fileSize > 5 * 1024 * 1024) tags.push("large-file");
  if (fileSize < 100 * 1024) tags.push("small-file");

  // Add random additional tags
  const additionalTags = [
    "important",
    "archived",
    "processed",
    "reviewed",
    "shared",
  ];
  const randomTag =
    additionalTags[Math.floor(Math.random() * additionalTags.length)];
  tags.push(randomTag);

  // Generate description
  const description =
    sampleDescriptions[Math.floor(Math.random() * sampleDescriptions.length)];

  // Generate confidence (between 0.7 and 0.95 for dummy data)
  const confidence = Math.round((0.7 + Math.random() * 0.25) * 100) / 100;

  // Generate dummy extracted text for text-based files
  let extractedText: string | undefined;
  if (!isImage) {
    extractedText = `Sample extracted text from ${fileName}. This would contain the actual text content extracted from the document.`;
  }

  // Assume English for dummy data
  const language = "en";

  return {
    description,
    tags: [...new Set(tags)], // Remove duplicates
    category,
    confidence,
    extractedText,
    language,
  };
}

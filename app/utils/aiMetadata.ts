// Fallback AI metadata generator for when AI analysis fails
import { PREDEFINED_CATEGORIES, PREDEFINED_TAGS } from "@/app/lib/constants";

export interface AIMetadata {
  category: string;
  isCustomCategory: boolean;
  tags: string[];
  confidence: number;
  language: string;
  description: string;
  aiName: string;
  processingStatus: "pending" | "completed" | "failed";
  lastAnalyzed: Date;
}

const commonTags = {
  pdf: ["dokument", "pdf", "tekst"],
  image: ["bilde", "visuell", "grafisk"],
  jpeg: ["foto", "bilde", "komprimert"],
  png: ["bilde", "grafisk", "gjennomsiktig"],
};

export function generateDummyAIMetadata(
  fileName: string,
  mimeType: string,
  fileSize: number
): AIMetadata {
  // Determine file type for category and tags
  const isImage = mimeType.startsWith("image/");
  const isPDF = mimeType === "application/pdf";

  // Generate category based on filename keywords or default
  let category = "Offentlig dokument"; // Default category
  let description = "Dokument lastet opp til systemet";
  let aiName =
    fileName.replace(/\.[^/.]+$/, "").split(/[-_\s]+/)[0] || "Dokument"; // Take first word only
  const lowerFileName = fileName.toLowerCase();

  // Simple keyword-based categorization
  if (lowerFileName.includes("pass") || lowerFileName.includes("passport")) {
    category = "Pass";
    description = "Passdokument for identifikasjon og reise";
    aiName = "Pass";
  } else if (
    lowerFileName.includes("kontrakt") ||
    lowerFileName.includes("contract")
  ) {
    category = "Arbeidskontrakt";
    description =
      "Arbeidskontrakt eller ansettelsesavtale som beskriver arbeidsforhold";
    aiName = "Kontrakt";
  } else if (lowerFileName.includes("attest")) {
    category = "Bostedsattest";
    description = "Attest som bekrefter bostedsadresse og folkeregistrering";
    aiName = "Attest";
  } else if (
    lowerFileName.includes("vitnemål") ||
    lowerFileName.includes("diploma")
  ) {
    category = "Vitnemål";
    description =
      "Utdanningsvitnemål eller diplom som bekrefter fullført utdanning";
    aiName = "Vitnemål";
  } else if (
    lowerFileName.includes("lønn") ||
    lowerFileName.includes("salary")
  ) {
    category = "Lønnslipp";
    description = "Lønnslipp som viser inntekt og arbeidsforhold";
    aiName = "Lønnslipp";
  } else if (lowerFileName.includes("bank")) {
    category = "Bankkontoutskrift";
    description = "Kontoutskrift fra bank som viser økonomisk situasjon";
    aiName = "Kontoutskrift";
  } else if (
    lowerFileName.includes("helse") ||
    lowerFileName.includes("health")
  ) {
    category = "Helseattest";
    description = "Helseattest eller medisinsk dokumentasjon";
    aiName = "Helseattest";
  }

  // Generate tags based on file type
  let tags: string[] = [];
  if (isImage) {
    tags = [...commonTags.image];
    if (mimeType === "image/jpeg") tags.push(...commonTags.jpeg);
    if (mimeType === "image/png") tags.push(...commonTags.png);
  } else if (isPDF) {
    tags = [...commonTags.pdf];
  }

  // Add size-based tags
  if (fileSize > 5 * 1024 * 1024) tags.push("stor-fil");
  if (fileSize < 100 * 1024) tags.push("liten-fil");

  // Add some random Norwegian tags
  const additionalTags = [
    "viktig",
    "arkivert",
    "behandlet",
    "gjennomgått",
    "delt",
  ];
  const randomTag =
    additionalTags[Math.floor(Math.random() * additionalTags.length)];
  tags.push(randomTag);

  // Generate confidence (between 0.3 and 0.6 for fallback data)
  const confidence = Math.round((0.3 + Math.random() * 0.3) * 100) / 100;

  return {
    category,
    isCustomCategory: false, // Fallback categories are predefined
    tags: [...new Set(tags)], // Remove duplicates
    confidence,
    language: "no", // Default to Norwegian
    description,
    aiName,
    processingStatus: "completed",
    lastAnalyzed: new Date(),
  };
}

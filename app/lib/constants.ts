// Predefined categories for Norwegian immigration documents
export const PREDEFINED_CATEGORIES = [
  // Identity Documents
  "Identifikasjonsbevis",
  "Pass",
  "Nasjonalt ID-kort",
  "Fødselsattest",

  // Residence Documents
  "Bostedsattest",
  "Folkeregisterutskrift",
  "Leieavtale",
  "Eiendomsdokument",

  // Work Documents
  "Arbeidskontrakt",
  "Arbeidsavtale",
  "Lønnslipp",
  "Skatteattest",
  "Arbeidsgiverbekreftelse",

  // Education Documents
  "Vitnemål",
  "Karakterutskrift",
  "Utdanningsbevis",
  "Kursbevis",

  // Family Documents
  "Vigselsattest",
  "Skilsmissepapirer",
  "Samboerbekreftelse",
  "Barneattest",

  // Financial Documents
  "Bankkontoutskrift",
  "Lånedokument",
  "Forsikringsbevis",
  "Pensjonsdokument",

  // Health Documents
  "Helseattest",
  "Vaksinasjonsbevis",
  "Medisinsk dokumentasjon",

  // Legal Documents
  "Fullmakt",
  "Juridisk dokument",
  "Rettslig bekreftelse",

  // Other Official Documents
  "Offentlig dokument",
  "Kommunal attest",
  "Politiattest",
];

// Predefined sensitive data tags for privacy protection
export const PREDEFINED_SENSITIVE_DATA_TAGS = [
  "navn",
  "fornavn",
  "etternavn",
  "fødselsnummer",
  "personnummer",
  "fødselsdato",
  "alder",
  "kjønn",
  "sivilstand",
  "statsborgerskap",
  "adresse",
  "postadresse",
  "bostedsadresse",
  "postnummer",
  "poststed",
  "telefonnummer",
  "mobilnummer",
  "e-post",
  "epostadresse",
  "lønn",
  "inntekt",
  "bankkonto",
  "kontonummer",
  "beløp",
  "ektefelle",
  "partner",
  "barn",
  "foreldre",
  "familie",
  "pårørende",
  "verge",
  "signatur",
];

// Predefined general tags for document classification (non-sensitive)
export const PREDEFINED_TAGS = [
  "kommune",
  "fylke",
  "land",
  "arbeidsgiver",
  "stilling",
  "arbeidssted",
  "ansettelsesdato",
  "arbeidsperiode",
  "yrke",
  "bransje",
  "utdanning",
  "skole",
  "universitet",
  "studieretning",
  "karakter",
  "eksamen",
  "grad",
  "kurs",
  "valuta",
  "skatt",
  "avgift",
  "forsikring",
  "utstedt",
  "gyldig",
  "utløper",
  "stempel",
  "bekreftelse",
  "attestert",
  "oversatt",
  "myndighet",
  "offentlig",
  "juridisk",
  "lovlig",
  "godkjent",
  "registrert",
  "autorisert",
  "dokument",
  "pdf",
  "bilde",
  "tekst",
  "visuell",
  "grafisk",
  "foto",
  "komprimert",
  "gjennomsiktig",
  "viktig",
  "arkivert",
  "behandlet",
  "gjennomgått",
  "delt",
  "stor-fil",
  "liten-fil",
];

// Custom category prefix
export const CUSTOM_CATEGORY_PREFIX = "CUSTOM_";

// Default confidence threshold
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;

// Supported languages
export const SUPPORTED_LANGUAGES = ["no", "en", "unknown"];

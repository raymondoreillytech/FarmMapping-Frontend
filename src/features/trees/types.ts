export type Tree = {
  id: number;
  lat: number;
  lon: number;
  confirmedSpeciesCode: string;
  confirmedSpeciesDisplayName: string;
  iconKey: string;
  statusCode: string;
  statusDisplayName: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SpeciesLookup = {
  code: string;
  displayName: string;
  scientificName: string | null;
  iconKey: string;
  unknown: boolean;
  active: boolean;
  sortOrder: number;
};

export type TreeStatusLookup = {
  code: string;
  displayName: string;
  active: boolean;
  sortOrder: number;
};

export type TreeIdentificationPredictionItem = {
  label: string;
  confidence: number;
};

export type TreeIdentificationPrediction = {
  modelVersion: string;
  predictions: TreeIdentificationPredictionItem[];
  rawTopPrediction: string;
  topPrediction: string;
  topConfidence: number;
  top2Margin: number;
  isUnknown: boolean;
  unknownReasons: string[];
  backbone: string;
  device: string;
};

export type TreePhoto = {
  id: number;
  treeId: number;
  s3Bucket: string;
  s3Key: string;
  originalFilename: string | null;
  contentType: string | null;
  sizeBytes: number;
  createdAt: string;
  capturedAt: string | null;
  exifLat: number | null;
  exifLon: number | null;
  primary: boolean;
  rawTopSpeciesCode: string | null;
  rawTopConfidence: number | null;
  finalPredictedSpeciesCode: string | null;
  finalPredictionConfidence: number | null;
  unknownPrediction: boolean;
  modelVersion: string | null;
  topPredictionsJson: unknown;
  downloadUrl: string | null;
  downloadUrlExpiresAt: string | null;
};

export type TreePhotoUploadMetadata = {
  uploadedByUserKey?: string;
  isPrimary?: boolean;
  rawTopSpeciesCode?: string | null;
  rawTopConfidence?: number | null;
  finalPredictedSpeciesCode?: string | null;
  finalPredictionConfidence?: number | null;
  unknownPrediction?: boolean;
  modelVersion?: string | null;
  topPredictionsJson?:
    | Array<{ speciesCode: string; confidence: number }>
    | null;
};

export type CreateTreeRequest = {
  lat: number;
  lon: number;
  confirmedSpeciesCode?: string;
  statusCode?: string;
  notes?: string | null;
  createdByUserKey?: string;
};

export type UpdateTreeRequest = {
  lat?: number;
  lon?: number;
  confirmedSpeciesCode?: string;
  statusCode?: string;
  notes?: string | null;
  updatedByUserKey?: string;
};

export type TreeFormState = {
  lat: number | null;
  lon: number | null;
  confirmedSpeciesCode: string;
  statusCode: string;
  notes: string;
};

export type CreateTreeLocationSource = "none" | "map" | "photo";

export const GUEST_USER_KEY = "guest";
export const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"] as const;

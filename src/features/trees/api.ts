import { buildApiUrl, ensureSuccess } from "../../lib/api";
import type {
  CreateTreeRequest,
  SpeciesLookup,
  Tree,
  TreeIdentificationPrediction,
  TreePhoto,
  TreePhotoUploadMetadata,
  TreeStatusLookup,
  UpdateTreeRequest,
} from "./types";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export async function getTrees() {
  const response = await ensureSuccess(await fetch(buildApiUrl("/api/trees")));
  return (await response.json()) as Tree[];
}

export async function getSpecies() {
  const response = await ensureSuccess(await fetch(buildApiUrl("/api/species")));
  return (await response.json()) as SpeciesLookup[];
}

export async function getTreeStatuses() {
  const response = await ensureSuccess(
    await fetch(buildApiUrl("/api/tree-status")),
  );
  return (await response.json()) as TreeStatusLookup[];
}

export async function createTree(request: CreateTreeRequest) {
  const response = await ensureSuccess(
    await fetch(buildApiUrl("/api/trees"), {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(request),
    }),
  );

  return (await response.json()) as Tree;
}

export async function updateTree(id: number, request: UpdateTreeRequest) {
  const response = await ensureSuccess(
    await fetch(buildApiUrl(`/api/trees/${id}`), {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(request),
    }),
  );

  return (await response.json()) as Tree;
}

export async function deleteTree(id: number) {
  await ensureSuccess(
    await fetch(buildApiUrl(`/api/trees/${id}`), {
      method: "DELETE",
    }),
  );
}

export async function predictTreeSpecies(file: File, topK = 3) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await ensureSuccess(
    await fetch(
      `${buildApiUrl("/api/tree-identification/predict")}?topK=${encodeURIComponent(String(topK))}`,
      {
        method: "POST",
        body: formData,
      },
    ),
  );

  return (await response.json()) as TreeIdentificationPrediction;
}

export async function getTreePhotos(treeId: number) {
  const response = await ensureSuccess(
    await fetch(buildApiUrl(`/api/trees/${treeId}/photos`)),
  );

  return (await response.json()) as TreePhoto[];
}

export async function uploadTreePhoto(
  treeId: number,
  file: File,
  metadata?: TreePhotoUploadMetadata,
) {
  const formData = new FormData();
  formData.append("file", file);

  if (metadata) {
    formData.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      "metadata.json",
    );
  }

  const response = await ensureSuccess(
    await fetch(buildApiUrl(`/api/trees/${treeId}/photos`), {
      method: "POST",
      body: formData,
    }),
  );

  return (await response.json()) as TreePhoto;
}

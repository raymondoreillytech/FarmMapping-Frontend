const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "")
  .toString()
  .trim()
  .replace(/\/+$/, "");

export function buildApiUrl(path: string) {
  return rawApiBaseUrl ? `${rawApiBaseUrl}${path}` : path;
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload: unknown = await response.json().catch(() => null);

    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>;
      const candidate = record.message ?? record.detail ?? record.error;

      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  const text = await response.text().catch(() => "");
  return text.trim();
}

export async function ensureSuccess(response: Response) {
  if (response.ok) {
    return response;
  }

  const message = await readErrorMessage(response);
  throw new Error(message || `Request failed with status ${response.status}`);
}

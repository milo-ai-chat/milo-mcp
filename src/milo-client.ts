const MILO_API_URL = process.env.MILO_API_URL ?? 'https://api.miloai.chat';

export interface SaveRequest {
  content: string;
  topic?: string;
  importance?: 'high' | 'normal';
}

export interface SaveResponse {
  saved: boolean;
  id: string | null;
  reason?: string | null;
}

export interface SearchResult {
  id: string;
  name: string;
  summary: string;
  content: string;
  source: string | null;
  owner_name: string | null;
  captured_at: string | null;
  updated_at: string;
}

async function miloFetch(
  token: string,
  path: string,
  options: RequestInit = {},
  source?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(source ? { 'X-Milo-Source': source } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };
  return fetch(`${MILO_API_URL}${path}`, { ...options, headers });
}

async function jsonOrThrow<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${label} failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function miloSave(
  token: string,
  body: SaveRequest,
  source: string
): Promise<SaveResponse> {
  const res = await miloFetch(token, '/api/mcp/save', {
    method: 'POST',
    body: JSON.stringify(body),
  }, source);
  // Backend returns 200 with {saved: false, reason} when relevance guard rejects;
  // other non-2xx codes are real errors.
  if (res.status === 422) {
    const data = (await res.json().catch(() => ({}))) as { detail?: string };
    return { saved: false, id: null, reason: data.detail ?? 'Not org-relevant' };
  }
  return jsonOrThrow<SaveResponse>(res, 'milo_save');
}

export async function miloSearch(
  token: string,
  q: string,
  limit = 5
): Promise<{ results: SearchResult[] }> {
  const res = await miloFetch(
    token,
    `/api/mcp/search?q=${encodeURIComponent(q)}&limit=${limit}`
  );
  return jsonOrThrow<{ results: SearchResult[] }>(res, 'milo_search');
}

export async function miloRecent(
  token: string,
  days = 7
): Promise<{ summary: string; days: number }> {
  const res = await miloFetch(token, `/api/mcp/recent?days=${days}`);
  return jsonOrThrow<{ summary: string; days: number }>(res, 'milo_recent');
}

export async function miloContext(
  token: string,
  topic: string,
  includeTacit = true
): Promise<{
  topic: string;
  entities: SearchResult[];
  tacit: { fact: string; category: string }[];
}> {
  const res = await miloFetch(
    token,
    `/api/mcp/context?topic=${encodeURIComponent(topic)}&include_tacit=${includeTacit}`
  );
  return jsonOrThrow(res, 'milo_context');
}

export async function miloPrompt(
  token: string,
  name: string
): Promise<{ name: string; text: string }> {
  const res = await miloFetch(token, `/api/mcp/prompts/${name}`);
  return jsonOrThrow(res, 'milo_prompts');
}

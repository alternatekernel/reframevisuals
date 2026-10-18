// Drop-in for fetch() on POST /portal/upload. Sends the file straight to Dropbox with a
// short-lived upload link (the serverless API has a ~4.5 MB request limit), then resolves
// with a Response shaped exactly like the old /portal/upload one so callers don't change.
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export async function uploadFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const file = init.body instanceof FormData ? init.body.get('file') : null;
  if (!(file instanceof File)) return fetch(url, init);

  const headers = { ...(init.headers as Record<string, string>), 'Content-Type': 'application/json' };
  const call = (path: string, body: unknown) =>
    fetch(`${url}${path}`, { method: 'POST', headers, credentials: init.credentials, signal: init.signal, body: JSON.stringify(body) });

  const initRes = await call('/init', { filename: file.name, size: file.size, mime: file.type });
  if (!initRes.ok) return initRes;
  const { uploadUrl, path } = (await initRes.json()).data;

  try {
    const put = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file,
      signal: init.signal,
    });
    if (!put.ok) return json({ success: false, message: 'File upload failed. Please try again.' }, 502);
    await put.arrayBuffer();
  } catch {
    return json({ success: false, message: 'File upload failed. Please try again.' }, 502);
  }

  return call('/complete', { path, filename: file.name, size: file.size });
}

export interface DirectUploaded {
  url: string;
  path: string;
  filename: string;
}

export function getGuestId(): string {
  let id = localStorage.getItem('portal_guest_id');
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `guest-${Math.random().toString(36).slice(2, 15)}${Math.random().toString(36).slice(2, 15)}`;
    localStorage.setItem('portal_guest_id', id);
  }
  return id;
}

/** Uploads files straight to Dropbox for the public forms; returns descriptors to submit instead of the files. */
export async function uploadFilesDirect(
  endpoint: string,
  files: File[],
  guestId: string,
  category: 'original' | 'support' = 'original',
): Promise<DirectUploaded[]> {
  return Promise.all(
    files.map(async (file) => {
      const body = new FormData();
      body.append('file', file);
      const res = await uploadFetch(endpoint, {
        method: 'POST',
        headers: { 'X-Guest-ID': guestId, 'X-Upload-Category': category },
        body,
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) throw new Error(result?.message || 'File upload failed. Please try again.');
      return { url: result.data.url, path: result.data.path, filename: file.name };
    }),
  );
}

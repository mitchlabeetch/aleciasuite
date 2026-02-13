export async function docusealApi(
  baseUrl: string,
  apiKey: string,
  method: string,
  path: string,
  body?: unknown
) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "X-Auth-Token": apiKey,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`DocuSeal API error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

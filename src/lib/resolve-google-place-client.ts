export type ResolveGooglePlaceResult = {
  placeId: string | null;
  resolvedUrl: string | null;
  normalizedLink?: string | null;
};

/** Resolve a Google review / Maps link server-side (follows goo.gl redirects). */
export async function resolveGooglePlaceIdViaApi(link: string): Promise<ResolveGooglePlaceResult> {
  const res = await fetch("/api/google/resolve-place", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ link: link.trim() }),
  });
  if (!res.ok) return { placeId: null, resolvedUrl: null };
  return (await res.json()) as ResolveGooglePlaceResult;
}

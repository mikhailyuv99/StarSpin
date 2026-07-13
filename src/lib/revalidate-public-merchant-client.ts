/** Client helper: bust public journey cache after a dashboard save. */
export async function revalidatePublicMerchantClient(
  slug: string,
  previousSlug?: string,
): Promise<void> {
  try {
    await fetch("/api/revalidate/merchant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        ...(previousSlug && previousSlug !== slug ? { previousSlug } : {}),
      }),
    });
  } catch {
    // Cache will expire within ~30s anyway.
  }
}

export async function verifyReviewScreenshot(
  file: File,
  merchantName: string,
): Promise<"verified" | "pending"> {
  try {
    const Tesseract = await import("tesseract.js");
    const { data } = await Tesseract.recognize(file, "eng+vie", {
      logger: () => {},
    });
    const text = data.text.toLowerCase();
    const nameMatch = merchantName
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.length > 2 && text.includes(word));
    const starMatch = /[★⭐]|\b[1-5]\s*(star|étoile|sao)\b|\b[1-5]\/5\b/i.test(text);
    if (nameMatch && starMatch) return "verified";
    return "pending";
  } catch {
    return "pending";
  }
}

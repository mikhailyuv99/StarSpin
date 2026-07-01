import type en from "./messages/en.json";

export type Messages = typeof en;

export function translate(
  messages: Messages,
  key: string,
  params?: Record<string, string | number>,
): string {
  const parts = key.split(".");
  let val: unknown = messages;
  for (const part of parts) {
    if (val && typeof val === "object" && part in (val as object)) {
      val = (val as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  if (typeof val !== "string") return key;
  if (!params) return val;
  return val.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
}

export function createTranslator(messages: Messages) {
  return (key: string, params?: Record<string, string | number>) =>
    translate(messages, key, params);
}

export type TFunction = ReturnType<typeof createTranslator>;

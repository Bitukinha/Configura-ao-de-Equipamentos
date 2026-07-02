type ErrorContext = Record<string, unknown>;

export function reportRuntimeError(error: unknown, context: ErrorContext = {}) {
  if (typeof window === "undefined") return;
  console.error("Application error", error, context);
}

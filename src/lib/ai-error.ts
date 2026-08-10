export type AiErrorCode =
  | "no_api_key"
  | "no_credits"
  | "invalid_api_key"
  | "rate_limit"
  | "api_error";

export interface AiError {
  code: AiErrorCode;
  message: string;
}

const FALLBACK: AiError = { code: "api_error", message: "Something went wrong" };

/**
 * Extracts the structured error returned by the `summarize` edge function.
 * Supabase surfaces non-2xx responses as a FunctionsHttpError whose body must
 * be read from `error.context`, so we handle both shapes here.
 */
export async function parseAiError(fnError: unknown, data: any): Promise<AiError | null> {
  let payload: any = null;

  if (fnError) {
    const ctx = (fnError as any)?.context;
    try {
      if (ctx && typeof ctx.json === "function") {
        payload = await ctx.clone().json();
      } else if (ctx && typeof ctx.text === "string") {
        payload = JSON.parse(ctx.text);
      }
    } catch {
      payload = null;
    }
    if (!payload) {
      return { code: "api_error", message: (fnError as any)?.message || FALLBACK.message };
    }
  } else if (data?.error) {
    payload = data;
  } else {
    return null;
  }

  return {
    code: (payload.errorCode as AiErrorCode) || "api_error",
    message: payload.error || FALLBACK.message,
  };
}

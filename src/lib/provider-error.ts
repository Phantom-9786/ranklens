/** Reduce provider failures to safe actionable categories; never expose raw bodies. */
export function providerErrorMessage(error: unknown): string {
  let current = error;
  for (let depth = 0; depth < 4; depth++) {
    if (!current || typeof current !== 'object') break;
    const record = current as { statusCode?: unknown; cause?: unknown; lastError?: unknown };
    if (record.statusCode === 429) return 'Gemini quota is currently exhausted or rate-limited. Check this key’s available model quota in Google AI Studio, then try again.';
    if (record.statusCode === 401 || record.statusCode === 403) return 'Gemini rejected access. The workspace owner should check the server key’s API permissions and restrictions.';
    if (record.statusCode === 404) return 'The configured Gemini model is unavailable for this key. The workspace owner should check GOOGLE_AI_MODEL.';
    if (record.statusCode === 400) return 'Gemini rejected the request or key configuration. The workspace owner should verify the Gemini API key and model settings.';
    current = record.lastError ?? record.cause;
  }
  return 'The AI provider could not complete this response. Please try again shortly.';
}

import * as Sentry from "@sentry/nextjs";
import logger from "./logger";

/**
 * Log an error locally and send it to Sentry in production.
 *
 * In development, only the local logger is used so you don't
 * pollute the Sentry project with test noise.
 */
export function reportError(
  err: unknown,
  context?: Record<string, unknown>
): void {
  const sendToSentry = process.env.NODE_ENV === "production" || process.env.SEND_TO_SENTRY === "true";

  if (sendToSentry) {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  }

  if (err instanceof Error) {
    logger.error({ err, ...context }, "Error captured");
  } else {
    logger.error({ error: String(err), ...context }, "Error captured");
  }
}

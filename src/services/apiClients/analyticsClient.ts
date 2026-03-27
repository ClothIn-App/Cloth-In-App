import { callApiEndpoint } from "../http";
import { log } from "../../debug/log";
import {
  recordProductViewEndpoint,
  RecordProductViewRequest,
} from "../endpoints/analytics/recordProductView";
import { getAnalyticsSessionId, getAnalyticsDevice } from "../analyticsSession";

/**
 * Fire-and-forget product view event. Never throws or blocks the caller.
 */
export async function recordProductView(
  productId: string,
  source?: string
): Promise<void> {
  try {
    const body: RecordProductViewRequest = {
      productId,
      sessionId: getAnalyticsSessionId(),
      source: source ?? "unknown",
      device: getAnalyticsDevice(),
    };
    await callApiEndpoint(recordProductViewEndpoint, { requestBody: body });
  } catch (e: any) {
    log.debug("[Analytics] recordProductView failed (non-blocking):", e?.message ?? e);
  }
}

export const analyticsClient = {
  recordProductView,
};

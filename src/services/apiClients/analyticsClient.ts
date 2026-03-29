import { callApiEndpoint } from "../http";
import { log } from "../../debug/log";
import {
  recordProductViewEndpoint,
  RecordProductViewRequest,
} from "../endpoints/analytics/recordProductView";
import {
  recordSearchEventEndpoint,
  RecordSearchEventRequest,
} from "../endpoints/analytics/recordSearchEvent";
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

/**
 * Fire-and-forget search interaction event. Never throws or blocks the caller.
 */
export async function recordSearchEvent(
  query: string,
  eventType: "search_submit" | "search_suggestion_click" | "search_result_click",
  options?: {
    category?: string;
    resultType?: string;
    resultId?: string;
  }
): Promise<void> {
  try {
    const body: RecordSearchEventRequest = {
      query,
      eventType,
      category: options?.category,
      resultType: options?.resultType,
      resultId: options?.resultId,
      sessionId: getAnalyticsSessionId(),
      device: getAnalyticsDevice(),
    };
    await callApiEndpoint(recordSearchEventEndpoint, { requestBody: body });
  } catch (e: any) {
    log.debug("[Analytics] recordSearchEvent failed (non-blocking):", e?.message ?? e);
  }
}

export const analyticsClient = {
  recordProductView,
  recordSearchEvent,
};

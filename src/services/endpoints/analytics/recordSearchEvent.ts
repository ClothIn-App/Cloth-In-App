import type { EndpointDefinition } from "../../http";

export type RecordSearchEventRequest = {
  query: string;
  eventType: string;
  category?: string;
  resultType?: string;
  resultId?: string;
  sessionId?: string;
  device?: string;
};

export type RecordSearchEventResponse = {
  ok: boolean;
};

export const recordSearchEventEndpoint: EndpointDefinition<
  RecordSearchEventRequest,
  RecordSearchEventResponse
> = {
  key: "analytics.record_search_event",
  method: "POST",
  pathTemplate: "/v1/analytics/search-event",
  auth: "optional",
  mock: async () => ({ ok: true }),
};

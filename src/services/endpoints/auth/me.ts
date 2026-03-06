import type { EndpointDefinition } from "../../http";

export type MeResponse = {
  userId: string;
};

export const meEndpoint: EndpointDefinition<undefined, MeResponse> = {
  key: "auth.me",
  method: "GET",
  pathTemplate: "/v1/me",
  auth: "required",
};

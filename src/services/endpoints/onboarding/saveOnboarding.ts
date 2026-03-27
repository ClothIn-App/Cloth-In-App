import type { EndpointDefinition } from "../../http";
import type {
  SaveOnboardingPayload,
  SaveOnboardingResponse,
} from "@/src/features/onboarding/types";

export const saveOnboardingEndpoint: EndpointDefinition<
  SaveOnboardingPayload,
  SaveOnboardingResponse
> = {
  key: "onboarding.save",
  method: "POST",
  pathTemplate: "/v1/onboarding/save/:userId",
  mock: async () => {
    await new Promise((r) => setTimeout(r, 150));
    return { success: true };
  },
};

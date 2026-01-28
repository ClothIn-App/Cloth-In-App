import type { EndpointDefinition } from "../../http";
import type {
  UpdateFitPicEngagementRequest,
  UpdateFitPicEngagementResponse,
  FitPic,
} from "../../../types/fitpic";
import { inMemoryFitpics } from "./createFitPic";

export const updateFitPicEngagementEndpoint: EndpointDefinition<
  UpdateFitPicEngagementRequest,
  UpdateFitPicEngagementResponse
> = {
  key: "fitpics.updateEngagement",
  method: "POST",
  pathTemplate: "/v1/fitpics/:fitpicId/engagement",
  auth: "optional",
  mock: async ({ pathParameters, body }) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!body) {
      return {
        success: false,
        error: "Missing request body",
      };
    }

    const fitpicId = pathParameters.fitpicId;
    const request = body as UpdateFitPicEngagementRequest;

    const fitpic: FitPic | undefined = inMemoryFitpics.find(
      (fp) => fp.id === fitpicId
    );

    if (!fitpic) {
      return {
        success: false,
        error: "FitPic not found",
      };
    }

    const engagement = { ...fitpic.engagement };

    switch (request.action) {
      case "like":
        engagement.likes += 1;
        engagement.isLiked = true;
        break;
      case "unlike":
        engagement.likes = Math.max(0, engagement.likes - 1);
        engagement.isLiked = false;
        break;
      case "save":
        engagement.saves += 1;
        engagement.isSaved = true;
        break;
      case "unsave":
        engagement.saves = Math.max(0, engagement.saves - 1);
        engagement.isSaved = false;
        break;
    }

    fitpic.engagement = engagement;

    const response: UpdateFitPicEngagementResponse = {
      success: true,
      engagement,
    };

    return response;
  },
};



import type { EndpointDefinition } from "../../http";
import type {
  UpdateFitPicEngagementRequest,
  UpdateFitPicEngagementResponse,
  FitPic,
} from "../../../types/fitpic";
import { inMemoryFitpics } from "./createFitPic";

type EngagementCountKey = "likes" | "dislikes" | "heart" | "fire" | "saves";

export const updateFitPicEngagementEndpoint: EndpointDefinition<
  UpdateFitPicEngagementRequest,
  UpdateFitPicEngagementResponse
> = {
  key: "fitpics.updateEngagement",
  method: "POST",
  pathTemplate: "/v1/fitpics/:fitpicId/engagement",
  // Server route uses current_user_id (required); must send Bearer token.
  auth: "required",
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
    const reactionToKey: Record<string, keyof typeof engagement> = {
      LIKE: "heart",
      THUMBS_UP: "likes",
      FIRE: "fire",
      DISLIKE: "dislikes",
    };

    switch (request.action) {
      case "react":
        if (request.reaction) {
          const prev = (fitpic.engagement as any).userReaction;
          if (prev && reactionToKey[prev]) {
            const prevKey = reactionToKey[prev] as EngagementCountKey;
            (engagement as Record<EngagementCountKey, number>)[prevKey] = Math.max(
              0,
              (engagement[prevKey] as number) - 1
            );
          }
          (engagement as any).userReaction = request.reaction;
          const key = reactionToKey[request.reaction];
          if (key)
            (engagement as Record<EngagementCountKey, number>)[key as EngagementCountKey] =
              ((engagement[key] as number) ?? 0) + 1;
        }
        break;
      case "unreact":
        if (request.reaction) {
          const prev = (fitpic.engagement as any).userReaction;
          if (prev === request.reaction) {
            const k = reactionToKey[request.reaction];
            if (k)
              (engagement as Record<EngagementCountKey, number>)[k as EngagementCountKey] = Math.max(
                0,
                (engagement[k] as number) - 1
              );
            (engagement as any).userReaction = undefined;
          }
        }
        break;
      case "save":
        engagement.saves = (engagement.saves ?? 0) + 1;
        engagement.isSaved = true;
        break;
      case "unsave":
        engagement.saves = Math.max(0, (engagement.saves ?? 0) - 1);
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



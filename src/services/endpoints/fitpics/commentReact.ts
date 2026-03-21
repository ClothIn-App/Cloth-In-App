import type { EndpointDefinition } from "../../http";
import type {
  CommentReactRequest,
  CommentReactResponse,
  FitPicComment,
} from "../../../types/fitpic";
import { inMemoryFitpics } from "./createFitPic";

export const commentReactEndpoint: EndpointDefinition<
  CommentReactRequest,
  CommentReactResponse
> = {
  key: "fitpics.commentReact",
  method: "POST",
  pathTemplate: "/v1/fitpics/:fitpicId/comments/react",
  auth: "required",
  mock: async ({ pathParameters, body }) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (!body) {
      return { success: false, error: "Missing request body" };
    }
    const fitpic = inMemoryFitpics.find((fp) => fp.id === pathParameters.fitpicId);
    if (!fitpic) {
      return { success: false, error: "FitPic not found" };
    }
    const findAndReact = (comments: FitPicComment[]): FitPicComment | null => {
      for (const c of comments) {
        if (c.id === body.commentId) {
          (c as any).reactionByUser = (c as any).reactionByUser || {};
          (c as any).reactionByUser["current_user"] = body.reaction;
          const rbu = (c as any).reactionByUser as Record<string, string>;
          c.like = Object.values(rbu).filter((v) => v === "like").length;
          c.dislike = Object.values(rbu).filter((v) => v === "dislike").length;
          return c;
        }
        const found = findAndReact(c.replies || []);
        if (found) return found;
      }
      return null;
    };
    const updated = findAndReact(fitpic.comments || []);
    if (!updated) {
      return { success: false, error: "Comment not found" };
    }
    return { success: true, comment: updated };
  },
};

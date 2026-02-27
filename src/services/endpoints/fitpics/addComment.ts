import type { EndpointDefinition } from "../../http";
import type {
  AddCommentRequest,
  AddCommentResponse,
  FitPicComment,
} from "../../../types/fitpic";
import { inMemoryFitpics } from "./createFitPic";

export const addCommentEndpoint: EndpointDefinition<
  AddCommentRequest,
  AddCommentResponse
> = {
  key: "fitpics.addComment",
  method: "POST",
  pathTemplate: "/v1/fitpics/:fitpicId/comments",
  auth: "required",
  mock: async ({ pathParameters, body }) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!body?.text?.trim()) {
      return { success: false, error: "text is required" };
    }
    const fitpicId = pathParameters.fitpicId;
    const fitpic = inMemoryFitpics.find((fp) => fp.id === fitpicId);
    if (!fitpic) {
      return { success: false, error: "FitPic not found" };
    }
    const newComment: FitPicComment = {
      id: `c_${Date.now()}`,
      user: "current_user",
      text: body.text.trim(),
      createdAt: new Date().toISOString(),
      like: 0,
      dislike: 0,
      replies: [],
    };
    if (body.parentCommentId) {
      const appendReply = (comments: FitPicComment[]): boolean => {
        for (const c of comments) {
          if (c.id === body.parentCommentId) {
            c.replies = c.replies || [];
            c.replies.push(newComment);
            return true;
          }
          if (appendReply(c.replies || [])) return true;
        }
        return false;
      };
      if (!appendReply(fitpic.comments || [])) {
        return { success: false, error: "Parent comment not found" };
      }
    } else {
      fitpic.comments = fitpic.comments || [];
      fitpic.comments.push(newComment);
    }
    return { success: true, comment: newComment };
  },
};

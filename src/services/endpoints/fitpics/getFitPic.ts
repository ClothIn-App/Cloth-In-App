import type { EndpointDefinition } from "../../http";
import type { GetFitPicResponse, FitPic } from "../../../types/fitpic";
import type { CommentType } from "../../../types/feed";
import { inMemoryFitpics } from "./createFitPic";
import { transformRawFitPic } from "../../fitpicUtils";

// Extended response type that includes comments
type GetFitPicResponseWithComments = GetFitPicResponse & {
  comments?: CommentType[];
};

// Helper to normalize comments
function normalizeComment(rawComment: any): CommentType {
  return {
    id: rawComment.id,
    user: rawComment.user,
    text: rawComment.text,
    createdAt: rawComment.createdAt,
    likes: rawComment.likes ?? rawComment.like ?? 0,
    dislikes: rawComment.dislikes ?? rawComment.dislike ?? 0,
    replies: (rawComment.replies || []).map(normalizeComment),
  };
}

export const getFitPicEndpoint: EndpointDefinition<undefined, GetFitPicResponseWithComments> =
  {
    key: "fitpics.get",
    method: "GET",
    pathTemplate: "/v1/fitpics/:fitpicId",
    auth: "optional",
    mock: async ({ pathParameters }) => {
      await new Promise((resolve) => setTimeout(resolve, 250));

      const id = pathParameters.fitpicId;
      
      // Check in-memory fitpics first
      const inMemoryFitpic = inMemoryFitpics.find((fp) => fp.id === id);
      if (inMemoryFitpic) {
        return {
          success: true,
          fitpic: inMemoryFitpic,
          comments: [], // In-memory fitpics don't have comments yet
        };
      }

      // Load static JSON data
      const fitpicsData = (await import("../../../mocks/mock-fitpics.json")).default;
      const usersData = (await import("../../../mocks/mock-users.json")).default;
      const productsData = (await import("../../../mocks/mock-products.json")).default;

      // Find raw fitpic
      const rawFitpic = fitpicsData.fitpics.find((fp: any) => fp.id === id);
      if (!rawFitpic) {
        return {
          success: false,
          error: "FitPic not found",
        };
      }

      // Transform using pure helper
      const userData = usersData[rawFitpic.author as keyof typeof usersData];
      const fitpic = transformRawFitPic(rawFitpic, userData, productsData.products);

      if (!fitpic) {
        return {
          success: false,
          error: "FitPic transformation failed",
        };
      }

      // Normalize comments from raw data
      const comments: CommentType[] = rawFitpic.comments 
        ? rawFitpic.comments.map(normalizeComment)
        : [];

      return {
        success: true,
        fitpic,
        comments,
      };
    },
  };



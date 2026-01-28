import type { EndpointDefinition } from "../../http";
import type { FitPic } from "../../../types/fitpic";

export type GetFitPicRequest = {
  fitpicId: string;
};

export type GetFitPicResponse = {
  fitpic: FitPic;
};

export const getFitPicEndpoint: EndpointDefinition<
  undefined,
  GetFitPicResponse
> = {
  key: "content.fitpic",
  method: "GET",
  pathTemplate: "/v1/content/fitpic/:fitpicId",
  auth: "optional",
  mock: async ({ pathParameters }) => {
    await new Promise((r) => setTimeout(r, 400));

    const fitpicId = pathParameters.fitpicId;
    // Note: This would need to be adapted based on actual fitpic mock structure
    // For now, we'll use a placeholder that matches the FitPic type
    const data = (await import("../../../mocks/mock-fitpics.json")).default;

    const rawFitpic = data.fitpics.find((fp: any) => fp.id === fitpicId);

    if (!rawFitpic) {
      throw new Error(`FitPic ${fitpicId} not found`);
    }

    // Transform mock data to FitPic type
    // This is a simplified transformation - adjust based on actual mock structure
    const fitpic: FitPic = {
      id: rawFitpic.id,
      authorId: rawFitpic.author,
      author: {
        uid: rawFitpic.author,
        username: rawFitpic.author,
        displayName: rawFitpic.author,
      },
      photos: [
        {
          id: `photo-${rawFitpic.id}`,
          url: rawFitpic.imagePath,
          thumbnailUrl: rawFitpic.imagePath,
          index: 0,
          isCover: true,
        },
      ],
      caption: rawFitpic.caption || "",
      products: [], // Would need to be populated from productIds
      createdAt: rawFitpic.createdAt,
      engagement: {
        likes: rawFitpic.reactions?.counts?.LIKE || 0,
        saves: 0,
        comments: rawFitpic.comments?.length || 0,
      },
      isPublic: true,
    };

    return { fitpic };
  },
};


import type { EndpointDefinition } from "../../http";
import type { FitPic } from "../../../types/fitpic";

export type GetFitPicsRequest = {
  limit?: number;
  cursor?: string;
  userId?: string;
  sortBy?: "newest" | "oldest" | "most_liked" | "most_saved" | "trending";
};

export type GetFitPicsResponse = {
  fitpics: FitPic[];
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  };
};

export const getFitPicsEndpoint: EndpointDefinition<
  GetFitPicsRequest,
  GetFitPicsResponse
> = {
  key: "content.fitpics",
  method: "GET",
  pathTemplate: "/v1/content/fitpics",
  auth: "optional",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 400));

    const limit = Number(queryParameters.limit) || 20;
    const cursor = queryParameters.cursor as string | undefined;
    const userId = queryParameters.userId as string | undefined;
    const sortBy = (queryParameters.sortBy as string) || "newest";

    const data = (await import("../../../mocks/mock-fitpics.json")).default;
    let fitpics = [...data.fitpics];

    // Filter by user if provided
    if (userId) {
      fitpics = fitpics.filter((fp: any) => fp.author === userId);
    }

    // Apply sorting
    if (sortBy === "newest") {
      fitpics.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === "oldest") {
      fitpics.sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sortBy === "most_liked") {
      fitpics.sort(
        (a: any, b: any) =>
          (b.reactions?.counts?.LIKE || 0) - (a.reactions?.counts?.LIKE || 0)
      );
    }

    // Apply pagination
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + limit;
    const paginatedFitpics = fitpics.slice(startIndex, endIndex);

    // Transform to FitPic type
    const transformedFitpics: FitPic[] = paginatedFitpics.map((fp: any) => ({
      id: fp.id,
      authorId: fp.author,
      author: {
        uid: fp.author,
        username: fp.author,
        displayName: fp.author,
      },
      photos: [
        {
          id: `photo-${fp.id}`,
          url: fp.imagePath,
          thumbnailUrl: fp.imagePath,
          index: 0,
          isCover: true,
        },
      ],
      caption: fp.caption || "",
      products: [],
      createdAt: fp.createdAt,
      engagement: {
        likes: fp.reactions?.counts?.LIKE || 0,
        saves: 0,
        comments: fp.comments?.length || 0,
      },
      isPublic: true,
    }));

    return {
      fitpics: transformedFitpics,
      pagination: {
        hasMore: endIndex < fitpics.length,
        nextCursor: endIndex < fitpics.length ? endIndex.toString() : undefined,
      },
    };
  },
};


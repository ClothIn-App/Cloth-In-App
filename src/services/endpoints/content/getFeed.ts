import type { EndpointDefinition } from "../../http";
import type { FitPic } from "../../../types/fitpic";
import type { ProductSearchResult } from "../../../types/search";
import { getCurrentUserId, getUserById } from "../../mockSessionUsers";

export type GetFeedRequest = {
  type?: "forYou" | "following" | "trending";
  limit?: number;
  cursor?: string;
};

export type GetFeedResponse = {
  fitpics: FitPic[];
  products: ProductSearchResult[];
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  };
};

export const getFeedEndpoint: EndpointDefinition<
  GetFeedRequest,
  GetFeedResponse
> = {
  key: "content.feed",
  method: "GET",
  pathTemplate: "/v1/content/feed",
  auth: "optional",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 800));

    const limit = Number(queryParameters.limit) || 20;
    const cursor = queryParameters.cursor as string | undefined;
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + limit;

    // Load fitpics
    const fitpicsData = (await import("../../../mocks/mock-fitpics.json")).default;
    const productsData = (await import("../../../mocks/mock-products.json")).default;
    const usersData = (await import("../../../mocks/mock-users.json")).default;

    const feedType = queryParameters.type as "forYou" | "following" | "trending" | undefined;
    
    // Filter fitpics based on feed type
    let filteredFitpics = fitpicsData.fitpics;
    
    if (feedType === "following") {
      // Get current user's following list
      const currentUserId = getCurrentUserId();
      const currentUser = getUserById(currentUserId);
      const followingIds = new Set(currentUser?.following?.userIds || []);
      
      // Only show fitpics from users the current user follows
      filteredFitpics = filteredFitpics.filter((fp: any) => 
        followingIds.has(fp.author)
      );
    }
    // For "forYou" and "trending", show all fitpics (no filtering)

    // Apply pagination to filtered results
    const paginatedFitpics = filteredFitpics.slice(startIndex, endIndex);

    // Transform fitpics to FitPic type (simplified)
    const fitpics: FitPic[] = paginatedFitpics.map((fp: any) => {
      const userData = usersData[fp.author as keyof typeof usersData];
      return {
        id: fp.id,
        authorId: fp.author,
        author: {
          uid: fp.author,
          username: userData?.username || fp.author,
          displayName: userData?.displayName || fp.author,
          avatarUrl: userData?.avatarUrl,
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
      };
    });

    // Transform products to ProductSearchResult type
    const products: ProductSearchResult[] = productsData.products
      .slice(0, 15)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: undefined,
        price: p.price,
        currency: "USD",
        priceStatus: "Fixed" as const,
        imageUrl: p.imagePath,
        purchaseUrl: p.productUrl,
      }));

    return {
      fitpics,
      products,
      pagination: {
        hasMore: endIndex < filteredFitpics.length,
        nextCursor: endIndex < filteredFitpics.length ? endIndex.toString() : undefined,
      },
    };
  },
};


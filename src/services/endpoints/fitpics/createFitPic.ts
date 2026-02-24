import type { EndpointDefinition } from "../../http";
import type {
  CreateFitPicRequest,
  CreateFitPicResponse,
  FitPic,
  FitPicEngagement,
  FitPicPhoto,
} from "../../../types/fitpic";
import { getCurrentUser } from "../../mockSessionUsers";

// Simple in-memory store for newly created fitpics in mock mode
const inMemoryFitpics: FitPic[] = [];

// Helper to generate IDs
function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const createFitPicEndpoint: EndpointDefinition<
  CreateFitPicRequest,
  CreateFitPicResponse
> = {
  key: "fitpics.create",
  method: "POST",
  pathTemplate: "/v1/fitpics",
  // Auth required: create cannot run without a token; client fails fast with Unauthorized if missing.
  auth: "required",
  mock: async ({ body }) => {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!body) {
      return {
        success: false,
        error: "Missing request body",
      };
    }

    const request = body as CreateFitPicRequest;

    if (!request.photos?.length) {
      return {
        success: false,
        error: "At least one photo is required",
      };
    }

    // For mock mode, wrap the provided network URLs into FitPicPhoto objects
    const photos: FitPicPhoto[] = request.photos.map((photo, index) => ({
      id: generateId("ph"),
      url: photo.url,
      thumbnailUrl: photo.url,
      index,
      isCover: index === 0,
      width: 800,
      height: 1000,
      alt: `Photo ${index + 1}`,
    }));

    // In mock mode, tie the new FitPic to the current mock session user if available.
    const currentUser = getCurrentUser();
    const authorId = currentUser?.id ?? "u_demo";

    const now = new Date().toISOString();

    const engagement: FitPicEngagement = {
      likes: 0,
      saves: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isSaved: false,
      reactions: [],
      userReactions: [],
    };

    const fitpic: FitPic = {
      id: generateId("fp"),
      authorId,
      author: {
        uid: authorId,
        username: currentUser?.username ?? "current_user",
        displayName: currentUser?.displayName ?? "Current User",
        avatarUrl: currentUser?.avatarUrl ?? "https://placehold.co/150x150",
      },
      photos,
      caption: request.caption,
      products: request.products ?? [],
      createdAt: now,
      updatedAt: now,
      engagement,
      location: request.location,
      isPublic: request.isPublic !== false,
      isReported: false,
      isHidden: false,
    };

    // Persist in in-memory store for mock mode so subsequent reads can see it
    inMemoryFitpics.push(fitpic);

    return {
      success: true,
      fitpic,
    };
  },
};

export { inMemoryFitpics };


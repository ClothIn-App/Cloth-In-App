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
  // Optional in mock mode so the mock can run without a real token (mock uses getCurrentUser from session).
  auth: "optional",
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
      dislikes: 0,
      heart: 0,
      fire: 0,
    };

    // Assemble the final stored caption: base caption + blank line + #tags (same logic as backend)
    const canonicalTags = (request.tags ?? [])
      .map(t => t.replace(/^#/, '').toLowerCase().replace(/[^a-z0-9_]/g, ''))
      .filter(Boolean);
    const storedCaption =
      canonicalTags.length === 0
        ? request.caption
        : request.caption
        ? `${request.caption}\n\n${canonicalTags.map(t => `#${t}`).join(' ')}`
        : canonicalTags.map(t => `#${t}`).join(' ');

    const fitpic: FitPic = {
      id: generateId("fp"),
      authorId,
      author: {
        uid: authorId,
        username: currentUser?.username ?? "current_user",
        displayName: currentUser?.displayName ?? "Current User",
        avatarUrl: currentUser?.avatarUrl,
      },
      photos,
      caption: storedCaption,
      products: request.products ?? [],
      createdAt: now,
      updatedAt: now,
      engagement,
      comments: [],
      location: request.location,
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


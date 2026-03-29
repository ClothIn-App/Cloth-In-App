/**
 * Tests for the following-feed endpoint definition and contentApiClient wiring.
 *
 * Uses manual mocks to avoid pulling in react-native (and Image.resolveAssetSource)
 * in the pure Node/ts-jest test environment.
 */

// ── Prevent react-native from being loaded in the Node test env ────────────
jest.mock("react-native", () => ({
  Image: { resolveAssetSource: jest.fn(() => null) },
}));

// Mock the full fitpicUtils module (imported by getFollowingFeed endpoint mock path)
jest.mock("../../src/services/fitpicUtils", () => ({
  transformRawFitPic: jest.fn(() => null),
  getImageUri: jest.fn(),
}));

jest.mock("../../src/maps/images", () => ({
  FITPIC_ASSETS: {},
  PRODUCT_ASSETS: {},
}));

// Mock http callApiEndpoint
jest.mock("../../src/services/http", () => {
  const actual = jest.requireActual("../../src/services/http");
  return {
    ...actual,
    callApiEndpoint: jest.fn(),
  };
});

import { contentApiClient } from "../../src/services/apiClients/contentClient";
import { getFollowingFeedEndpoint } from "../../src/services/endpoints/content/getFollowingFeed";
import { callApiEndpoint } from "../../src/services/http";

describe("contentApiClient.getFollowingFeed -> transport wiring", () => {
  beforeEach(() => {
    (callApiEndpoint as unknown as jest.Mock).mockReset();
  });

  test("calls getFollowingFeedEndpoint with no params when cursor/limit omitted", async () => {
    const transportResult = { items: [], nextCursor: null, hasMore: false };
    (callApiEndpoint as unknown as jest.Mock).mockResolvedValueOnce(transportResult);

    const result = await contentApiClient.getFollowingFeed();

    expect(callApiEndpoint).toHaveBeenCalledTimes(1);
    const [endpointArg, optionsArg] = (callApiEndpoint as unknown as jest.Mock).mock.calls[0];
    expect(endpointArg).toBe(getFollowingFeedEndpoint);
    expect(optionsArg).toEqual({ queryParameters: {} });
    expect(result).toBe(transportResult);
  });

  test("forwards cursor and limit as query parameters", async () => {
    const transportResult = {
      items: [{ id: "fp-1" }],
      nextCursor: "cursor-40",
      hasMore: true,
    };
    (callApiEndpoint as unknown as jest.Mock).mockResolvedValueOnce(transportResult);

    const result = await contentApiClient.getFollowingFeed("cursor-20", 20);

    expect(callApiEndpoint).toHaveBeenCalledTimes(1);
    const [endpointArg, optionsArg] = (callApiEndpoint as unknown as jest.Mock).mock.calls[0];
    expect(endpointArg).toBe(getFollowingFeedEndpoint);
    expect(optionsArg).toEqual({ queryParameters: { cursor: "cursor-20", limit: 20 } });
    expect(result).toBe(transportResult);
  });

  test("transport errors propagate to caller", async () => {
    (callApiEndpoint as unknown as jest.Mock).mockRejectedValueOnce(
      new Error("Unauthorized")
    );

    await expect(contentApiClient.getFollowingFeed()).rejects.toThrow("Unauthorized");
  });

  test("endpoint definition has correct key, method, path and auth", () => {
    expect(getFollowingFeedEndpoint.key).toBe("content.followingFeed");
    expect(getFollowingFeedEndpoint.method).toBe("GET");
    expect(getFollowingFeedEndpoint.pathTemplate).toBe("/v1/content/following-feed");
    expect(getFollowingFeedEndpoint.auth).toBe("required");
  });
});

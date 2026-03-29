/**
 * Tests for GET /v1/content/following endpoint definition and contentApiClient wiring.
 */

jest.mock("react-native", () => ({
  Image: { resolveAssetSource: jest.fn(() => null) },
}));

jest.mock("../../src/services/fitpicUtils", () => ({
  transformRawFitPic: jest.fn(() => null),
  getImageUri: jest.fn(),
}));

jest.mock("../../src/maps/images", () => ({
  FITPIC_ASSETS: {},
  PRODUCT_ASSETS: {},
}));

jest.mock("../../src/services/http", () => {
  const actual = jest.requireActual("../../src/services/http");
  return {
    ...actual,
    callApiEndpoint: jest.fn(),
  };
});

import { contentApiClient } from "../../src/services/apiClients/contentClient";
import { getFollowingEndpoint } from "../../src/services/endpoints/content/getFollowing";
import { callApiEndpoint } from "../../src/services/http";

describe("contentApiClient.getFollowing -> transport wiring", () => {
  beforeEach(() => {
    (callApiEndpoint as unknown as jest.Mock).mockReset();
  });

  test("calls getFollowingEndpoint with empty query when params omitted", async () => {
    const transportResult = { items: [], pagination: null };
    (callApiEndpoint as unknown as jest.Mock).mockResolvedValueOnce(transportResult);

    const result = await contentApiClient.getFollowing();

    expect(callApiEndpoint).toHaveBeenCalledTimes(1);
    const [endpointArg, optionsArg] = (callApiEndpoint as unknown as jest.Mock).mock.calls[0];
    expect(endpointArg).toBe(getFollowingEndpoint);
    expect(optionsArg).toEqual({ queryParameters: {} });
    expect(result).toBe(transportResult);
  });

  test("forwards cursor and limit as query parameters", async () => {
    const transportResult = {
      items: [{ type: "fitpic" as const, fitpic: { id: "fp-1" } }],
      pagination: { hasMore: true, nextCursor: "cursor-40" },
    };
    (callApiEndpoint as unknown as jest.Mock).mockResolvedValueOnce(transportResult);

    const result = await contentApiClient.getFollowing({ limit: 20, cursor: "cursor-20" });

    expect(callApiEndpoint).toHaveBeenCalledTimes(1);
    const [endpointArg, optionsArg] = (callApiEndpoint as unknown as jest.Mock).mock.calls[0];
    expect(endpointArg).toBe(getFollowingEndpoint);
    expect(optionsArg).toEqual({
      queryParameters: { limit: 20, cursor: "cursor-20" },
    });
    expect(result).toBe(transportResult);
  });

  test("transport errors propagate to caller", async () => {
    (callApiEndpoint as unknown as jest.Mock).mockRejectedValueOnce(new Error("Unauthorized"));

    await expect(contentApiClient.getFollowing()).rejects.toThrow("Unauthorized");
  });

  test("endpoint definition has correct key, method, path and auth", () => {
    expect(getFollowingEndpoint.key).toBe("content.following");
    expect(getFollowingEndpoint.method).toBe("GET");
    expect(getFollowingEndpoint.pathTemplate).toBe("/v1/content/following");
    expect(getFollowingEndpoint.auth).toBe("required");
  });
});

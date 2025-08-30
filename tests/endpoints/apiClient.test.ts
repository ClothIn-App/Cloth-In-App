// tests/apiClient.test.ts
/**
 * Verifies:
 *  - apiClient.signup -> calls callApiEndpoint with signupEndpoint + { requestBody }
 *  - apiClient.getUser -> calls callApiEndpoint with getUserEndpoint + { pathParameters }
 *  - errors from callApiEndpoint propagate to caller
 */

jest.mock("../../src/services/http", () => {
  // Keep all real exports except replace callApiEndpoint with a jest.fn()
  const actual = jest.requireActual("../../src/services/http");
  return {
    ...actual,
    callApiEndpoint: jest.fn(),
  };
});

import { authApiClient, userApiClient } from "../../src/services/apiClients";
import {
  signupEndpoint,
  getUserEndpoint,
} from "../../src/services/endpoints";
import { callApiEndpoint } from "../../src/services/http";

describe("apiClient -> transport wiring", () => {
  beforeEach(() => {
    (callApiEndpoint as unknown as jest.Mock).mockReset();
  });

  test("signup forwards endpoint + payload", async () => {
    const payload = {
      email: "x@y.com",
      password: "pass",
      confirmPassword: "pass",
    };
    const transportResult = {
      idToken: "id",
      refreshToken: "refresh",
      user: { uid: "u-1", email: "x@y.com" },
    };

    (callApiEndpoint as unknown as jest.Mock).mockResolvedValueOnce(
      transportResult
    );

    const result = await authApiClient.signup(payload);

    // called exactly once with the endpoint object and correct options
    expect(callApiEndpoint).toHaveBeenCalledTimes(1);
    const [endpointArg, optionsArg] = (
      callApiEndpoint as unknown as jest.Mock
    ).mock.calls[0];

    expect(endpointArg).toBe(signupEndpoint);
    expect(optionsArg).toEqual({ requestBody: payload });
    // apiClient returns whatever the transport resolves with
    expect(result).toBe(transportResult);
  });

  test("getUser forwards endpoint + path parameter", async () => {
    const userId = "abc-123";
    const transportResult = {
      user: { uid: userId, email: "user+abc-123@example.com" },
    };

    (callApiEndpoint as unknown as jest.Mock).mockResolvedValueOnce(
      transportResult
    );

    const result = await userApiClient.getUser(userId);

    expect(callApiEndpoint).toHaveBeenCalledTimes(1);
    const [endpointArg, optionsArg] = (
      callApiEndpoint as unknown as jest.Mock
    ).mock.calls[0];

    expect(endpointArg).toBe(getUserEndpoint);
    expect(optionsArg).toEqual({ pathParameters: { userId } });
    expect(result).toBe(transportResult);
  });

  test("errors from transport are propagated", async () => {
    const err = new Error("Unauthorized");
    (callApiEndpoint as unknown as jest.Mock).mockRejectedValueOnce(err);

    await expect(userApiClient.getUser("z")).rejects.toThrow("Unauthorized");
  });
});

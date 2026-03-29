jest.mock("../../src/services/http", () => {
  const actual = jest.requireActual("../../src/services/http");
  return {
    ...actual,
    callApiEndpoint: jest.fn(),
  };
});

import { notificationsApiClient } from "../../src/services/apiClients/notificationsClient";
import { getNotificationsEndpoint } from "../../src/services/endpoints/notifications/getNotifications";
import { markAllNotificationsReadEndpoint } from "../../src/services/endpoints/notifications/markAllNotificationsRead";
import { callApiEndpoint } from "../../src/services/http";

describe("notificationsApiClient -> transport wiring", () => {
  beforeEach(() => {
    (callApiEndpoint as unknown as jest.Mock).mockReset();
  });

  test("getNotifications forwards endpoint + query params", async () => {
    const transportResult = {
      success: true,
      notifications: [],
      pagination: null,
    };
    (callApiEndpoint as unknown as jest.Mock).mockResolvedValueOnce(transportResult);

    const result = await notificationsApiClient.getNotifications({
      limit: 20,
      cursor: "abc",
    });

    expect(callApiEndpoint).toHaveBeenCalledTimes(1);
    const [endpointArg, optionsArg] = (callApiEndpoint as unknown as jest.Mock).mock.calls[0];
    expect(endpointArg).toBe(getNotificationsEndpoint);
    expect(optionsArg).toEqual({
      queryParameters: { limit: 20, cursor: "abc" },
    });
    expect(result).toBe(transportResult);
  });

  test("transport errors propagate to caller", async () => {
    (callApiEndpoint as unknown as jest.Mock).mockRejectedValueOnce(
      new Error("Unauthorized")
    );

    await expect(notificationsApiClient.getNotifications()).rejects.toThrow("Unauthorized");
  });

  test("markAllNotificationsRead forwards endpoint + empty body", async () => {
    const transportResult = { success: true, updated: 2 };
    (callApiEndpoint as unknown as jest.Mock).mockResolvedValueOnce(transportResult);

    const result = await notificationsApiClient.markAllNotificationsRead();

    expect(callApiEndpoint).toHaveBeenCalledTimes(1);
    const [endpointArg, optionsArg] = (callApiEndpoint as unknown as jest.Mock).mock.calls[0];
    expect(endpointArg).toBe(markAllNotificationsReadEndpoint);
    expect(optionsArg).toEqual({ requestBody: {} });
    expect(result).toBe(transportResult);
  });
});

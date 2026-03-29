import { callApiEndpoint } from "../http";
import {
  getNotificationsEndpoint,
  GetNotificationsRequest,
} from "../endpoints/notifications/getNotifications";
import {
  markAllNotificationsReadEndpoint,
  MarkAllNotificationsReadRequest,
} from "../endpoints/notifications/markAllNotificationsRead";
import type {
  GetNotificationsResponse,
  MarkAllNotificationsReadResponse,
} from "../../types/notification";

export async function getNotifications(
  params: GetNotificationsRequest = {}
): Promise<GetNotificationsResponse> {
  return callApiEndpoint<GetNotificationsRequest, GetNotificationsResponse>(
    getNotificationsEndpoint,
    { queryParameters: params }
  );
}

export async function markAllNotificationsRead(): Promise<MarkAllNotificationsReadResponse> {
  return callApiEndpoint<
    MarkAllNotificationsReadRequest,
    MarkAllNotificationsReadResponse
  >(markAllNotificationsReadEndpoint, { requestBody: {} });
}

export const notificationsApiClient = {
  getNotifications,
  markAllNotificationsRead,
};

export type {
  GetNotificationsRequest,
  GetNotificationsResponse,
  MarkAllNotificationsReadResponse,
};

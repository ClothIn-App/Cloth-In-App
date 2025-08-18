// src/services/apiClient.ts
import { callApiEndpoint } from "../http";
import {
	getUserEndpoint,
	type GetUserResponse,
} from "../endpoints";

export const userApiClient = {
	getUser: (userId: string) =>
		callApiEndpoint<undefined, GetUserResponse>(getUserEndpoint, {
			pathParameters: { userId },
		}),
};

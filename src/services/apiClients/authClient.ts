// src/services/apiClient.ts
import { callApiEndpoint } from "../http";
import {
	signupEndpoint,
	type SignupPayload,
	type SignupResponse,
	loginEndpoint,
	type LoginPayload,
	type LoginResponse,
} from "../endpoints";

export const authApiClient = {
	signup: (payload: SignupPayload) =>
		callApiEndpoint<SignupPayload, SignupResponse>(signupEndpoint, {
			requestBody: payload,
		}),

	login: (payload: LoginPayload) =>
		callApiEndpoint<LoginPayload, LoginResponse>(loginEndpoint, {
		  requestBody: payload,
    }),
};

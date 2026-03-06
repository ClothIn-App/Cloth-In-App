import { loginEndpoint } from "../endpoints/auth/login";
import { meEndpoint, type MeResponse } from "../endpoints/auth/me";
import { signupEndpoint } from "../endpoints/auth/signup";
import { callApiEndpoint } from "../http";

// function-style
export async function signup(body: any) {
  return callApiEndpoint<any, any>(signupEndpoint, { requestBody: body });
}
export async function login(body: any) {
  return callApiEndpoint<any, any>(loginEndpoint, { requestBody: body });
}

/** Get current user id from backend (GET /v1/me). Returns null on 401 or error. */
export async function getMe(): Promise<string | null> {
  try {
    const res = await callApiEndpoint<undefined, MeResponse>(meEndpoint, {});
    return res?.userId ?? null;
  } catch {
    return null;
  }
}

// object-style (what your screens import)
export const authApiClient = { signup, login, getMe };

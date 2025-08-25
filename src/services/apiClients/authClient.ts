import { loginEndpoint } from "../endpoints/auth/login";
import { signupEndpoint } from "../endpoints/auth/signup";
import { callApiEndpoint } from "../http";

// function-style
export async function signup(body: any) {
  return callApiEndpoint<any, any>(signupEndpoint, { requestBody: body });
}
export async function login(body: any) {
  return callApiEndpoint<any, any>(loginEndpoint, { requestBody: body });
}

// object-style (what your screens import)
export const authApiClient = { signup, login };

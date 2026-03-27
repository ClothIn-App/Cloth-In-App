import type { EndpointDefinition } from "../../http";

export type DeleteAccountResponse = {
  success: boolean;
  alreadyDeleted?: boolean;
  error?: string;
};

export const deleteMeEndpoint: EndpointDefinition<undefined, DeleteAccountResponse> = {
  key: "users.deleteMe",
  method: "DELETE",
  pathTemplate: "/v1/users/me",
  auth: "required",
  mock: async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true, alreadyDeleted: false };
  },
};

import type { EndpointDefinition } from "../../http";
import type { FitPic } from "../../../types/fitpic";
import { getCurrentUser } from "../../mockSessionUsers";
import { inMemoryFitpics } from "./createFitPic";

export type DeleteFitPicResponse = {
  success: boolean;
  error?: string;
};

export const deleteFitPicEndpoint: EndpointDefinition<undefined, DeleteFitPicResponse> =
  {
    key: "fitpics.delete",
    method: "DELETE",
    pathTemplate: "/v1/fitpics/:fitpicId",
    auth: "required",
    mock: async ({ pathParameters }) => {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const fitpicId = pathParameters.fitpicId;
      const currentUser = getCurrentUser();

      const index = inMemoryFitpics.findIndex((fp: FitPic) => fp.id === fitpicId);

      if (index === -1) {
        return {
          success: false,
          error: "FitPic not found",
        };
      }

      const fitpic = inMemoryFitpics[index];
      if (currentUser && fitpic.authorId !== currentUser.id) {
        return {
          success: false,
          error: "Forbidden",
        };
      }

      inMemoryFitpics.splice(index, 1);

      return { success: true };
    },
  };



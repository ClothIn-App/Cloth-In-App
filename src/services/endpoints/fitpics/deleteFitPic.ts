import type { EndpointDefinition } from "../../http";
import type { FitPic } from "../../../types/fitpic";
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
    auth: "optional",
    mock: async ({ pathParameters }) => {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const fitpicId = pathParameters.fitpicId;

      const index = inMemoryFitpics.findIndex((fp: FitPic) => fp.id === fitpicId);

      if (index === -1) {
        return {
          success: false,
          error: "FitPic not found",
        };
      }

      inMemoryFitpics.splice(index, 1);

      return { success: true };
    },
  };



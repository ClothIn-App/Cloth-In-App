// src/services/endpoints/index.ts
export * from "./auth";
export * from "./users";
export * from "./profile";
export * from "./fitpics";
export * from "./search";
export * from "./notifications";
// Content: explicit re-exports only (exclude getFeed, getFitPic, getFitPics to avoid collision with fitpics)
export {
  getProductEndpoint,
  GetProductRequest,
  GetProductResponse,
} from "./content/getProduct";
export {
  getProductsEndpoint,
  GetProductsRequest,
  GetProductsResponse,
} from "./content/getProducts";
export {
  createProductEndpoint,
  CreateProductRequest,
  CreateProductResponse,
  CreateProductImage,
} from "./content/createProduct";
export { updateProductEngagementEndpoint } from "./content/updateProductEngagement";
export { addProductCommentEndpoint } from "./content/addProductComment";
export { productCommentReactEndpoint } from "./content/productCommentReact";
export * from "./onboarding";

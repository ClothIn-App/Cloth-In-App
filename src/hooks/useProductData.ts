import { useMemo } from "react";
import { Product, FitPic } from "../types/content";
import type { CommentType } from "../types/feed";
import productsData from "../mocks/mock-products.json";
import fitpicsData from "../mocks/mock-fitpics.json";
import sessionData from "../mocks/mock-session.json";
import usersData from "../mocks/mock-users.json";

type UseProductDataResult = {
  product: Product | undefined;
  featuredFitPics: FitPic[];
  comments: CommentType[]; // Normalized comments in CommentType format
  userFitPics?: FitPic[]; // FitPics filtered by userId (optional)
  followersFitPics?: FitPic[]; // FitPics from current user's followers (optional)
};

// Recursive helper to normalize comments (convert 'like' to 'likes', 'dislike' to 'dislikes')
const normalizeComment = (rawComment: any): CommentType => {
  return {
    id: rawComment.id,
    user: rawComment.user,
    text: rawComment.text,
    createdAt: rawComment.createdAt,
    likes: rawComment.likes ?? rawComment.like ?? 0,
    dislikes: rawComment.dislikes ?? rawComment.dislike ?? 0,
    replies: (rawComment.replies || []).map(normalizeComment),
  };
};

export function useProductData(productId: string | undefined, userId?: string | undefined): UseProductDataResult {
  const { product, featuredFitPics, comments, userFitPics, followersFitPics } = useMemo(() => {
    if (!productId) {
      return {
        product: undefined,
        featuredFitPics: [],
        comments: [],
        userFitPics: [],
        followersFitPics: [],
      };
    }

    // Find the product by id
    const rawProduct = productsData.products.find(
      (p) => p.id === productId
    );

    // Normalize the product
    const product: Product | undefined = rawProduct ? {
      ...rawProduct,
    } : undefined;

    // Normalize comments to CommentType format
    const comments: CommentType[] = rawProduct?.comments
      ? rawProduct.comments.map(normalizeComment)
      : [];

    // Map fitpics to add productsUsed field (derived from featuredProducts.productIds)
    const allFitPics: FitPic[] = fitpicsData.fitpics.map((fp: any) => ({
      ...fp,
      productsUsed: fp.featuredProducts?.productIds || [],
    })) as FitPic[];

    // Filter fitpics that include this product id in productsUsed
    const featuredFitPics = allFitPics.filter((fp) =>
      Array.isArray(fp.productsUsed) && fp.productsUsed.includes(productId)
    );

    // Filter fitpics by userId if provided (author matches userId and product is in productsUsed)
    const userFitPics = userId
      ? featuredFitPics.filter((fp) => fp.author === userId)
      : [];

    // Filter fitpics from current user's followers
    let followersFitPics: FitPic[] = [];
    try {
      const currentUserId = sessionData.currentUserId;
      const users = usersData as Record<string, any>;
      const currentUser = users[currentUserId];
      
      if (currentUser?.followers?.userIds) {
        const followerIds = new Set(currentUser.followers.userIds);
        followersFitPics = featuredFitPics.filter((fp) => 
          followerIds.has(fp.author)
        );
      }
    } catch (error) {
      // If there's an error getting followers, just return empty array
      console.warn("Error getting followers FitPics:", error);
    }

    return {
      product,
      featuredFitPics,
      comments,
      userFitPics,
      followersFitPics,
    };
  }, [productId, userId]);

  return { product, featuredFitPics, comments, userFitPics, followersFitPics };
}


import { useState, useEffect, useMemo, useCallback } from "react";
import { Product, Reactions as ProductReactions } from "../types/content";
import type { FitPic } from "../types/fitpic";
import type { CommentType } from "../types/feed";
import { contentApiClient } from "../services/apiClients/contentClient";
import { fitpicClient } from "../services/apiClients/fitpicClient";
import { userApiClient } from "../services/apiClients/userClient";
import { getCurrentUserId, getCurrentUser } from "../services/mockSessionUsers";

type UseProductDataResult = {
  product: Product | undefined;
  featuredFitPics: FitPic[];
  comments: CommentType[];
  userFitPics?: FitPic[];
  followersFitPics?: FitPic[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
};

// Recursive helper to normalize comments (like→likes, dislike→dislikes; preserve authorId from endpoint)
const normalizeComment = (rawComment: any): CommentType => {
  const result: CommentType = {
    id: rawComment.id,
    user: rawComment.user,
    text: rawComment.text,
    createdAt: rawComment.createdAt,
    likes: rawComment.likes ?? rawComment.like ?? 0,
    dislikes: rawComment.dislikes ?? rawComment.dislike ?? 0,
    replies: (rawComment.replies || []).map(normalizeComment),
  };
  if (rawComment.authorId != null) result.authorId = rawComment.authorId;
  return result;
};

/** Normalize product from either mock JSON shape or real API shape into Product */
export function normalizeProduct(rawProduct: any): Product {
  if (!rawProduct) {
    // This should never be used, but provides a safe fallback
    return {
      id: "",
      name: "",
      brand: "",
      price: 0,
      imagePath: "",
      description: "",
    };
  }

  // Images: support both string[] and { url }[]
  const imagesArray: string[] = Array.isArray(rawProduct.images)
    ? rawProduct.images.map((img: any) =>
        typeof img === "string" ? img : img?.url
      ).filter(Boolean)
    : [];

  const primaryImage =
    rawProduct.imagePath ??
    rawProduct.primaryImageUrl ??
    imagesArray[0] ??
    "";

  // Reactions: support mock shape ({ counts }) and API shape ({ LIKE, THUMBS_UP, ... })
  let reactions: ProductReactions | undefined;
  if (rawProduct.reactions) {
    const r = rawProduct.reactions;
    if ("counts" in r) {
      reactions = r as ProductReactions;
    } else {
      reactions = {
        counts: {
          LIKE: r.LIKE ?? 0,
          THUMBS_UP: r.THUMBS_UP ?? 0,
          FIRE: r.FIRE ?? 0,
          DISLIKE: r.DISLIKE ?? 0,
        },
      };
    }
  }

  const rawColor =
    typeof rawProduct.color === "string" ? rawProduct.color.trim() : "";
  const color = rawColor.length > 0 ? rawColor : undefined;

  const categoryRaw =
    typeof rawProduct.category === "string" ? rawProduct.category.trim() : "";
  const category = categoryRaw.length > 0 ? categoryRaw : undefined;

  const brandId =
    typeof rawProduct.brandId === "string" && rawProduct.brandId.trim()
      ? rawProduct.brandId.trim()
      : undefined;

  return {
    id: rawProduct.id,
    name: rawProduct.name,
    brand: rawProduct.brand ?? "",
    ...(brandId ? { brandId } : {}),
    ...(category ? { category } : {}),
    color,
    price: rawProduct.price ?? 0,
    originalPrice: rawProduct.originalPrice,
    priceType: rawProduct.priceType,
    imagePath: primaryImage,
    description: rawProduct.description ?? "",
    specs: rawProduct.specs ?? rawProduct.specifications,
    productUrl: rawProduct.productUrl,
    images: imagesArray.length ? imagesArray : undefined,
    reactions,
    comments: rawProduct.comments,
  };
}

export function useProductData(productId: string | undefined, userId?: string | undefined): UseProductDataResult {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [featuredFitPics, setFeaturedFitPics] = useState<FitPic[]>([]);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    if (!productId) {
      setProduct(undefined);
      setFeaturedFitPics([]);
      setComments([]);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const productResponse = await contentApiClient.getProduct(productId);

      const loadedProduct = (productResponse as any)?.product;
      const normalizedProduct = normalizeProduct(loadedProduct);
      setProduct(normalizedProduct);

      const normalizedComments = (loadedProduct as any)?.comments
        ? (loadedProduct as any).comments.map(normalizeComment)
        : [];
      setComments(normalizedComments);

      try {
        const feedResponse = await fitpicClient.list(undefined, 100);
        const allFitPics = feedResponse.fitpics || [];
        const featured = allFitPics.filter((fp: FitPic) =>
          fp.products?.some((p) => p.id === productId)
        );
        setFeaturedFitPics(featured);
      } catch (fitpicError) {
        console.warn("Failed to load featured FitPics:", fitpicError);
      }
    } catch (err) {
      console.error("Error loading product data:", err);
      setProduct(undefined);
      setFeaturedFitPics([]);
      setComments([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter fitpics by userId if provided
  const userFitPics = useMemo(() => {
    if (!userId) return [];
    return featuredFitPics.filter((fp) => fp.authorId === userId);
  }, [featuredFitPics, userId]);

  // Filter fitpics from current user's followers
  const followersFitPics = useMemo(() => {
    try {
      const currentUserId = getCurrentUserId();
      const currentUser = getCurrentUser();
      
      if (!currentUser?.followers?.userIds) return [];
      
      const followerIds = new Set(currentUser.followers.userIds);
      return featuredFitPics.filter((fp) => 
        followerIds.has(fp.authorId)
      );
    } catch (error) {
      console.warn("Error getting followers FitPics:", error);
      return [];
    }
  }, [featuredFitPics]);

  return { 
    product, 
    featuredFitPics, 
    comments, 
    userFitPics, 
    followersFitPics,
    loading,
    error,
    refresh: loadData,
  };
}


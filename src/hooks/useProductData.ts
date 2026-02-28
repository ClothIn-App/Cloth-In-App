import { useState, useEffect, useMemo } from "react";
import { Product, FitPic, Reactions as ProductReactions } from "../types/content";
import type { CommentType } from "../types/feed";
import { contentApiClient } from "../services/apiClients/contentClient";
import { fitpicClient } from "../services/apiClients/fitpicClient";
import { userApiClient } from "../services/apiClients/userClient";
import { getCurrentUserId, getCurrentUser } from "../services/mockSessionUsers";

type UseProductDataResult = {
  product: Product | undefined;
  featuredFitPics: FitPic[];
  comments: CommentType[]; // Normalized comments in CommentType format
  userFitPics?: FitPic[]; // FitPics filtered by userId (optional)
  followersFitPics?: FitPic[]; // FitPics from current user's followers (optional)
  loading: boolean;
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

// Normalize product from either mock JSON shape or real API shape into Product
const normalizeProduct = (rawProduct: any): Product => {
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

  return {
    id: rawProduct.id,
    name: rawProduct.name,
    brand: rawProduct.brand ?? "",
    price: rawProduct.price ?? 0,
    imagePath: primaryImage,
    description: rawProduct.description ?? "",
    specs: rawProduct.specs ?? rawProduct.specifications,
    productUrl: rawProduct.productUrl,
    images: imagesArray.length ? imagesArray : undefined,
    reactions,
    comments: rawProduct.comments,
  };
};

export function useProductData(productId: string | undefined, userId?: string | undefined): UseProductDataResult {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [featuredFitPics, setFeaturedFitPics] = useState<FitPic[]>([]);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setProduct(undefined);
      setFeaturedFitPics([]);
      setComments([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        // Load product
        const productResponse = await contentApiClient.getProduct(productId);
        if (cancelled) return;

        const loadedProduct = (productResponse as any)?.product;
        const normalizedProduct = normalizeProduct(loadedProduct);
        setProduct(normalizedProduct);
        
        // Normalize comments
        const normalizedComments = (loadedProduct as any)?.comments
          ? (loadedProduct as any).comments.map(normalizeComment)
          : [];
        setComments(normalizedComments);

        // Load all fitpics to find featured ones
        // Use fitpicClient to get feed which includes all fitpics
        const feedResponse = await fitpicClient.getFeed({ 
          type: 'forYou',
          limit: 100 
        });
        if (cancelled) return;

        const allFitPics = feedResponse.fitpics || [];
        
        // Filter fitpics that include this product id
        const featured = allFitPics.filter((fp: FitPic) =>
          fp.products?.some((p) => p.id === productId)
        );
        setFeaturedFitPics(featured);
      } catch (error) {
        console.error("Error loading product data:", error);
        if (!cancelled) {
          setProduct(undefined);
          setFeaturedFitPics([]);
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [productId]);

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
  };
}


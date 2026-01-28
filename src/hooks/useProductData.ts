import { useState, useEffect, useMemo } from "react";
import { Product, FitPic } from "../types/content";
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

        const loadedProduct = productResponse.product;
        setProduct(loadedProduct as Product);
        
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


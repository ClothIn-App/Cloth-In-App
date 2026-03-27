import { useState, useCallback } from "react";
import type { Reactions, CommentType, ReactionKey } from "../types/feed";
import { contentApiClient } from "../services/apiClients/contentClient";
import { userApiClient } from "../services/apiClients/userClient";
import {
  getCurrentUser,
  mapGetUserResponseToRawUser,
  setRealCurrentUser,
} from "../services/mockSessionUsers";

const DEFAULT_REACTIONS: Reactions = {
  counts: { LIKE: 0, THUMBS_UP: 0, FIRE: 0, DISLIKE: 0 },
};

export function useProductEngagement(
  productId: string | undefined,
  initialReactions: Reactions = DEFAULT_REACTIONS,
  initialIsSaved = false
) {
  const [reactions, setReactions] = useState<Reactions>(initialReactions);
  const [isSaved, setIsSaved] = useState(initialIsSaved);

  const handleReactionPress = useCallback(
    async (key: ReactionKey, isAdding: boolean) => {
      if (!productId) return;
      try {
        const res = await contentApiClient.updateProductEngagement({
          productId,
          action: isAdding ? "react" : "unreact",
          reaction: key,
        });
        if (res.success && res.reactions) {
          setReactions({
            counts: {
              LIKE: res.reactions.LIKE ?? 0,
              THUMBS_UP: res.reactions.THUMBS_UP ?? 0,
              FIRE: res.reactions.FIRE ?? 0,
              DISLIKE: res.reactions.DISLIKE ?? 0,
            },
          });
        }
      } catch (e) {
        console.warn("Failed to update reaction:", e);
      }
    },
    [productId]
  );

  const handleToggleSave = useCallback(
    async (nextSaved: boolean) => {
      if (!productId) return;
      const isRealMode = process.env.EXPO_PUBLIC_API_MODE === "real";
      if (isRealMode) {
        try {
          const res = await contentApiClient.updateProductEngagement({
            productId,
            action: nextSaved ? "save" : "unsave",
          });
          if (res.success) {
            setIsSaved(nextSaved);
            const currentUser = getCurrentUser();
            const uid = currentUser?.id;
            if (uid) {
              const response = await userApiClient.getUser(uid);
              if (response?.user) {
                setRealCurrentUser(uid, mapGetUserResponseToRawUser(response.user, uid));
              }
            }
          }
        } catch (e) {
          console.warn("Failed to update save:", e);
        }
        return;
      }
      // Mock mode: update local state and in-memory user
      setIsSaved(nextSaved);
      const currentUser = getCurrentUser();
      if (currentUser) {
        if (!currentUser.saved) currentUser.saved = [];
        const saved = currentUser.saved;
        if (nextSaved) {
          if (!saved.some((item: { id: string; type: string }) => item.id === productId && item.type === "product")) {
            saved.unshift({ id: productId, type: "product" });
          }
        } else {
          const index = saved.findIndex(
            (item: { id: string; type: string }) => item.id === productId && item.type === "product"
          );
          if (index !== -1) saved.splice(index, 1);
        }
      }
    },
    [productId]
  );

  const handleSubmitComment = useCallback(
    async (text: string, parentCommentId?: string): Promise<CommentType | null> => {
      if (!productId) return null;
      try {
        const res = await contentApiClient.addProductComment(productId, {
          text: text.trim(),
          parentCommentId: parentCommentId || undefined,
        });
        if (!res.success || !res.comment) return null;
        const c = res.comment;
        return {
          id: c.id,
          user: c.user,
          text: c.text,
          createdAt: c.createdAt,
          likes: c.like ?? 0,
          dislikes: c.dislike ?? 0,
          replies: [],
          userReaction: c.userReaction,
        };
      } catch (e) {
        console.warn("Failed to add comment:", e);
        return null;
      }
    },
    [productId]
  );

  const handleCommentReact = useCallback(
    async (commentId: string, reaction: "like" | "dislike") => {
      if (!productId) return;
      await contentApiClient.productCommentReact(productId, { commentId, reaction });
    },
    [productId]
  );

  const addReplyToCommentTree = useCallback(
    (comments: CommentType[], targetCommentId: string, newReply: CommentType): CommentType[] => {
      return comments.map((comment) => {
        if (comment.id === targetCommentId) {
          return { ...comment, replies: [...(comment.replies || []), newReply] };
        }
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: addReplyToCommentTree(comment.replies, targetCommentId, newReply),
          };
        }
        return comment;
      });
    },
    []
  );

  return {
    reactions,
    setReactions,
    isSaved,
    setIsSaved,
    handleReactionPress,
    handleToggleSave,
    handleSubmitComment,
    handleCommentReact,
    addReplyToCommentTree,
  };
}

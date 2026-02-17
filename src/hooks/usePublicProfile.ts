import { useCallback, useEffect, useRef, useState } from "react";
import { userApiClient } from "../services/apiClients/userClient";
import { getUserById } from "../services/mockSessionUsers";
import { getCurrentUserId } from "../services/mockSessionUsers";

export type PublicProfileData = {
  user: {
    uid: string;
    displayName?: string | null;
    username?: string;
    avatarUrl?: string;
    bio?: string | null;
    accountType?: string | null;
    counts?: {
      posts: number;
      following: number;
      followers: number;
    };
    closet?: {
      base?: { productIds?: string[] };
      racks?: Array<{
        id: string;
        name: string;
        productIds?: string[];
        createdAt?: number;
      }>;
    };
  };
  isFollowing: boolean;
  isPrivateAccount: boolean;
  canViewContent: boolean; // true if public OR (private AND following)
};

export function usePublicProfile(userId?: string) {
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const reqRef = useRef(0);

  const load = useCallback(async () => {
    const myReq = ++reqRef.current;

    // If we don't have a userId yet, keep loading state
    if (!userId) {
      setLoading(true);
      setError(null);
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load user data and follow status in parallel
      const [userResponse, followStatusResponse] = await Promise.all([
        userApiClient.getUser(userId),
        userApiClient.getFollowStatus(userId),
      ]);

      if (reqRef.current === myReq) {
        if (!userResponse.user) {
          setError(new Error(`User ${userId} not found`));
          return;
        }

        // Prefer privacy from API (supports profile edits); fallback to raw mock data
        const isPrivateAccount =
          userResponse.user?.privacy?.isPrivateAccount ??
          !!getUserById(userId)?.privacy?.isPrivateAccount;
        const isFollowing = followStatusResponse.isFollowing;
        
        // Can view content if: public account OR (private account AND following)
        const canViewContent = !isPrivateAccount || isFollowing;

        setData({
          user: userResponse.user,
          isFollowing,
          isPrivateAccount,
          canViewContent,
        });
      }
    } catch (e) {
      if (reqRef.current === myReq) setError(e);
    } finally {
      if (reqRef.current === myReq) setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  // Function to refresh follow status (after follow/unfollow)
  const refreshFollowStatus = useCallback(async () => {
    if (!userId) return;
    
    try {
      const followStatusResponse = await userApiClient.getFollowStatus(userId);
      const userResponse = await userApiClient.getUser(userId);
      const isPrivateAccount =
        userResponse.user?.privacy?.isPrivateAccount ??
        !!getUserById(userId)?.privacy?.isPrivateAccount;
      const isFollowing = followStatusResponse.isFollowing;
      const canViewContent = !isPrivateAccount || isFollowing;

      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isFollowing,
          canViewContent,
        };
      });
    } catch (e) {
      console.error("Error refreshing follow status:", e);
    }
  }, [userId]);

  return { data, loading, error, refetch: load, refreshFollowStatus };
}

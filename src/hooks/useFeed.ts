// src/hooks/useFeed.ts
// Skeleton feed: just fetches mock posts for "For You" and "Following".
// No ranking logic yet – API will handle that later.

import { useEffect, useState } from "react";
import { fetchAllPosts, fetchFollowedPosts } from "../services/feedApi";
import type { Post } from "../types/post";

type FeedTab = "forYou" | "following";

export function useFeed(tab: FeedTab) {
  const [data, setData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      let posts: Post[] = [];

      if (tab === "forYou") {
        posts = await fetchAllPosts();
      } else {
        posts = await fetchFollowedPosts();
      }

      if (alive) {
        setData(posts);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tab]);

  return { data, loading };
}

export default useFeed;






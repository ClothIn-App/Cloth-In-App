/*decides which posts to Fetch and Rank*/
import { rankFollowing, rankForYou } from "../algorithms/rankers";
import { fetchAllPosts, fetchFollowedPosts } from "../services/feedApi";
import { Post } from "../types/post";

import { useEffect, useState } from "react";

export function useFeed(tab: "forYou" | "following") {
  const [data, setData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let posts: Post[] = [];
      if (tab === "forYou") {
        posts = await fetchAllPosts();
        posts = rankForYou(posts);
      } else {
        posts = await fetchFollowedPosts();
        posts = rankFollowing(posts);
      }
      setData(posts);
      setLoading(false);
    })();
  }, [tab]);

  return { data, loading };
}

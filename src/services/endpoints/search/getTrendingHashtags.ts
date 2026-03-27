import type { EndpointDefinition } from "../../http";
import type { HashtagSearchResult } from "../../../types/search";

export const getTrendingHashtagsEndpoint: EndpointDefinition<
  undefined,
  HashtagSearchResult[]
> = {
  key: "search.hashtags.trending",
  method: "GET",
  pathTemplate: "/v1/search/hashtags/trending",
  auth: "optional",
  mock: async () => {
    // Derive trending tags from mock fitpic captions (same logic as HashtagPickerModal module cache)
    const fitpicsData = (await import("../../../mocks/mock-fitpics.json")).default;
    const counts = new Map<string, number>();
    for (const fp of (fitpicsData as any).fitpics as { caption?: string }[]) {
      if (!fp.caption) continue;
      const matches = fp.caption.match(/#(\w+)/g) ?? [];
      for (const m of matches) {
        const tag = m.substring(1).toLowerCase();
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    return sorted.map(([tag, postCount], i) => ({
      tag,
      postCount,
      isTrending: i < 5,
      trendDirection: postCount >= 3 ? ('up' as const) : postCount >= 2 ? ('stable' as const) : undefined,
    }));
  },
};

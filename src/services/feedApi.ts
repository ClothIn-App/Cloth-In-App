/*Fetch Posts - Services handles API calls*/
import { Post } from "../types/post";


// Mock data for now
const MOCK_POSTS: Post[] = [
  { id: "1", title: "Post One", image: "https://picsum.photos/300/400" },
  { id: "2", title: "Post Two", image: "https://picsum.photos/301/400" },
  { id: "3", title: "Post Three", image: "https://picsum.photos/302/400" },
  { id: "4", title: "Post Four", image: "https://picsum.photos/303/400" },
];

export async function fetchAllPosts(): Promise<Post[]> {
  return MOCK_POSTS;
}

export async function fetchFollowedPosts(): Promise<Post[]> {
  return MOCK_POSTS.slice(0, 2);
}

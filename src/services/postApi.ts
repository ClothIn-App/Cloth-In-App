/**
 * postApi.ts
 * Service layer for creating and retrieving posts.
 * These are just placeholders for now and should be replaced with real API calls.
 */
import { Post } from "../types/post";
export async function createPost(input: Partial<Post>): Promise<Post> {
  // TODO: Replace with real upload + POST request
  return {
    id: "new-id",
    title: input.title ?? "Untitled Post",
    image: input.image ?? "https://picsum.photos/300/400",
    authorId: input.authorId ?? "unknown",
  };
}

export async function getPostById(id: string): Promise<Post | null> {
  // TODO: Replace with GET request by ID
  return {
    id,
    title: "Sample Post",
    image: "https://picsum.photos/300/400",
    authorId: "sample-author",
  };
}

export async function listMyPosts(userId: string): Promise<Post[]> {
  // TODO: Replace with GET request for user's posts
  return [
    {
      id: "1",
      title: "My First Post",
      image: "https://picsum.photos/300/400",
      authorId: userId,
    },
  ];
}

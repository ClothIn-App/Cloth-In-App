// The shape of a Post object used across the app
export type Post = {
  id: string;
  title: string;
  image: string;
  authorId?: string;
  tags?: string[];
  createdAt?: number;
  engagement?: {
    likes: number;
    saves: number;
  };
};

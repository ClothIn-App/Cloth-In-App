// The shape of a Post object used across the app
// Note: This is being phased out in favor of FitPic type
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

// Legacy compatibility - FitPic can be used where Post is expected
export type { FitPic as FitPicPost } from './fitpic';

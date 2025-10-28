export type FitPicItem = {
    id: string;
    type: "fitpic";
    uri: string;
    width?: number;   // intrinsic
    height?: number;  // intrinsic
  };
  
  export type ProductItem = {
    id: string;
    type: "product";
    uri: string;      // product image
    brand: string;
    name: string;
  };
  
  export type FeedItem = FitPicItem | ProductItem;
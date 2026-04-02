import * as React from "react";
import { View, ScrollView } from "react-native";
import CategorySelect from "./categoryselect";
import BrandSelect from "./brandselect";
import ProductName from "./productname";
import ProductColor from "./productcolor";
import SpecificationsDescription from "./specificationsdescription";
import ProductLink from "./link";
import ProductPhotos from "./productphotos";
import AddPrice from "./addprice";

type ProductFormBodyProps = {
  footerSpacerHeight: number;
};

export function ProductFormBody({ footerSpacerHeight }: ProductFormBodyProps) {
  return (
    <ScrollView
      style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      nestedScrollEnabled
      automaticallyAdjustKeyboardInsets={true}
    >
      <CategorySelect />
      <BrandSelect />
      <ProductName />
      <ProductColor />
      <SpecificationsDescription />
      <ProductLink />
      <ProductPhotos />
      <AddPrice />
      <View style={{ height: footerSpacerHeight }} />
    </ScrollView>
  );
}

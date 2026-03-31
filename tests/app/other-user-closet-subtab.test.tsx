import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("react-native-safe-area-context", () => {
  const ReactLocal = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: { children?: React.ReactNode }) =>
      ReactLocal.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock("@expo/vector-icons", () => {
  const ReactLocal = require("react");
  const { View } = require("react-native");
  return {
    Ionicons: () => ReactLocal.createElement(View, null),
  };
});

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => true,
}));

jest.mock("@/src/services/apiClients/userClient", () => ({
  userApiClient: {
    getUser: jest.fn(),
  },
}));

jest.mock("@/src/services/apiClients/contentClient", () => ({
  contentApiClient: {
    getProduct: jest.fn().mockResolvedValue({ product: null }),
  },
}));

jest.mock("@/src/maps/images", () => ({
  PRODUCT_ASSETS: {
    "prod-1": { uri: "https://example.com/prod-1.png" },
  },
}));

jest.mock("@/components/account/closet/ClosetProductCard", () => {
  const ReactLocal = require("react");
  const { View } = require("react-native");
  return function MockClosetProductCard({ width }: { width?: number }) {
    return ReactLocal.createElement(View, { style: { width }, testID: "mock-closet-product-card" });
  };
});

jest.mock("@/components/account/closet/EndlessRackCarousel", () => {
  const ReactLocal = require("react");
  const { View } = require("react-native");
  const Mock = ReactLocal.forwardRef(
    (
      props: {
        products: { id: string }[];
        renderItem: (p: { id: string }, w: number) => React.ReactNode;
      },
      _ref: unknown
    ) =>
      ReactLocal.createElement(
        View,
        { testID: "mock-endless-carousel" },
        props.products.map((p) =>
          ReactLocal.createElement(View, { key: p.id }, props.renderItem(p, 100))
        )
      )
  );
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/account/closet/RackDetailModal", () => {
  const ReactLocal = require("react");
  const { View } = require("react-native");
  return function MockRackDetailModal() {
    return ReactLocal.createElement(View, { testID: "mock-rack-detail-modal" });
  };
});

jest.mock("@/components/account/closet/RackStackTile", () => {
  const ReactLocal = require("react");
  const { Pressable, Text } = require("react-native");
  return function MockRackStackTile({
    title,
    onPress,
  }: {
    title: string;
    onPress?: () => void;
  }) {
    return ReactLocal.createElement(
      Pressable,
      { onPress, accessibilityLabel: title },
      ReactLocal.createElement(Text, null, title)
    );
  };
});

import OtherUserClosetSubtab from "@/components/other-user-profile/OtherUserClosetSubtab";
import { userApiClient } from "@/src/services/apiClients/userClient";

const mockGetUser = userApiClient.getUser as jest.Mock;

describe("OtherUserClosetSubtab", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockGetUser.mockReset();
    mockGetUser.mockResolvedValue({
      user: {
        closet: {
          base: { productIds: ["prod-1"] },
          racks: [{ id: "rack-a", name: "Rack A", productIds: [], createdAt: 1 }],
        },
      },
    });
  });

  test("does not expose add-rack or all-products overflow management controls", async () => {
    const screen = render(
      <OtherUserClosetSubtab userId="owner-42" testID="ous-closet" initialCloset={{}} />
    );

    await waitFor(() => {
      expect(screen.getByText("All Products")).toBeTruthy();
    });

    expect(screen.queryByLabelText("Add new rack")).toBeNull();
    expect(screen.queryByLabelText("Rack options")).toBeNull();
    expect(screen.queryByLabelText("Rack A options")).toBeNull();
  });

  test("carousel product press passes closet owner userId to router.push", async () => {
    const screen = render(<OtherUserClosetSubtab userId="owner-42" testID="ous-closet" />);

    await waitFor(() => {
      expect(screen.getByTestId("ous-closet-all-products-prod-1")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("ous-closet-all-products-prod-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/closet-product-detail",
      params: { id: "prod-1", userId: "owner-42" },
    });
  });

  test("shows error and retry when getUser fails and no initialCloset", async () => {
    mockGetUser.mockRejectedValueOnce(new Error("network down"));

    const onRetry = jest.fn();
    const screen = render(
      <OtherUserClosetSubtab userId="owner-42" onRetry={onRetry} />
    );

    await waitFor(() => {
      expect(screen.getByText("Error loading closet")).toBeTruthy();
    });

    expect(screen.getByText("network down")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Retry loading closet"));
    expect(mockGetUser).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalled();
  });
});

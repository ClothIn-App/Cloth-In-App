import React from "react";
import FitPicsTab from "./tabs/FitPicsTab";
import ClosetTab from "./tabs/ClosetTab";
import SavedTab from "./tabs/SavedTab";

type Props = { 
  activeKey: string;
  userId?: string;
};

export default function TabContent({ activeKey, userId }: Props) {
  switch (activeKey) {
    case "fitpics":
      return <FitPicsTab userId={userId} />;
    case "closet":
      return <ClosetTab userId={userId} />;
    case "saved":
      return <SavedTab userId={userId} />;
    default:
      return <FitPicsTab userId={userId} />;
  }
}

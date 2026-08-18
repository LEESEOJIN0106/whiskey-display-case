import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "나의 셀러",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function HomePage() {
  return <Dashboard />;
}

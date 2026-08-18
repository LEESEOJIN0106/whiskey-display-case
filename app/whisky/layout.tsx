import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "나의 셀러",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function WhiskyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

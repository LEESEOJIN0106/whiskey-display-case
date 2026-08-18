import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "로그인",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    url: `${SITE_URL}/login`,
    title: `로그인 | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    title: `로그인 | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

export const SITE_HOST = "whiskeylog.vercel.app";
export const SITE_URL = "https://whiskeylog.vercel.app";
export const SITE_NAME = "whiskeylog";
export const SITE_TITLE = "whiskeylog";
export const SITE_DESCRIPTION =
  "위로그로 에어링을 추적하고, 시음의 순간을 남기세요.";
export const SITE_KEYWORDS = [
  "whiskeylog",
  "위로그",
  "위스키",
  "위스키 관리",
  "위스키 셀러",
  "에어링",
  "테이스팅 노트",
  "whisky",
  "whiskey",
];

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ??
  "";

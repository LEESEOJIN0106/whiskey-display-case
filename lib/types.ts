export type WhiskyStatus = "UNOPENED" | "OPENED" | "FINISHED";

export type AiringInfo = {
  airingDays: number | null;
  label: string | null;
};

export type Whisky = {
  id: string;
  userId: string;
  name: string;
  distillery: string;
  abv: number;
  openedAt: string | null;
  status: WhiskyStatus;
  remainingPercent: number;
  imageUrl: string | null;
  createdAt: string;
  airingDays: number | null;
  label: string | null;
  notes?: TastingNote[];
};

export type ImageSuggestion = {
  id: string;
  url: string;
  thumbUrl: string;
  alt: string;
  source: string;
  sourceUrl: string;
};

export type WhiskyNameSuggestion = {
  kind?: "entity" | "query";
  label: string;
  name: string;
  distillery: string;
  subtitle?: string;
  imageUrl?: string | null;
};

export type TastingNote = {
  id: string;
  whiskyId: string;
  userId: string;
  tastedAt: string;
  rating: number;
  tags: string[];
  memo: string;
  isPublic: boolean;
  createdAt: string;
};

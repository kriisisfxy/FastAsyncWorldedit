export type PlayerSource = {
  id: string;
  label: string;
  quality: string | null;
  kind: "file" | "embed";
  url: string;
  mime?: string;
  subtitles: { id: string; language: string; label: string; url: string }[];
};

export type NextUp = { href: string; title: string; label: string };
export type ProgressTarget = { movieId: string } | { episodeId: string };

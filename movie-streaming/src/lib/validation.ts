import { z } from "zod";

const trimmed = (max: number) => z.string().trim().max(max);
const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || v.startsWith("/") || /^https:\/\//i.test(v), "Must be an https:// URL or a site path")
  .transform((v) => v || null)
  .nullable()
  .optional();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Password needs a letter")
  .regex(/[0-9]/, "Password needs a number");

export const registerSchema = z.object({
  name: trimmed(60).min(2, "Name is too short"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(128),
});

export const forgotSchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")) });
export const resetSchema = z.object({ token: z.string().min(20).max(200), password: passwordSchema });

export const profileSchema = z.object({
  name: trimmed(60).min(2).optional(),
  currentPassword: z.string().max(128).optional(),
  newPassword: passwordSchema.optional(),
});

export const progressSchema = z
  .object({
    movieId: z.string().max(40).optional(),
    episodeId: z.string().max(40).optional(),
    positionSec: z.number().int().min(0).max(60 * 60 * 24),
    durationSec: z.number().int().min(0).max(60 * 60 * 24),
  })
  .refine((v) => !!v.movieId !== !!v.episodeId, "Provide either movieId or episodeId");

export const watchlistSchema = z
  .object({ movieId: z.string().max(40).optional(), seriesId: z.string().max(40).optional() })
  .refine((v) => !!v.movieId !== !!v.seriesId, "Provide either movieId or seriesId");

export const ratingSchema = z.object({ movieId: z.string().max(40), value: z.number().int().min(1).max(10) });

export const castSchema = z.object({
  name: trimmed(100).min(1),
  role: z.enum(["ACTOR", "DIRECTOR", "WRITER", "PRODUCER", "COMPOSER"]).default("ACTOR"),
  character: trimmed(100).optional().nullable(),
});

export const subtitleSchema = z.object({
  language: trimmed(10).min(2),
  label: trimmed(40).min(1),
  url: z.string().trim().max(2000).refine((v) => v.startsWith("/") || /^https:\/\//i.test(v), "Subtitle must be an https URL"),
});

export const sourceSchema = z.object({
  provider: z.enum(["VIDEA", "DIRECT"]),
  ref: z.string().trim().min(1, "Source is required").max(4000),
  label: trimmed(40).default("Default"),
  quality: trimmed(20).optional().nullable(),
  language: trimmed(20).optional().nullable(),
  isPrimary: z.boolean().default(false),
  subtitles: z.array(subtitleSchema).max(20).default([]),
});

export const movieSchema = z.object({
  title: trimmed(200).min(1, "Title is required"),
  slug: trimmed(80).regex(/^[a-z0-9-]*$/, "Slug: lowercase letters, numbers and dashes").optional(),
  tagline: trimmed(200).optional().nullable(),
  description: trimmed(5000).min(1, "Description is required"),
  releaseDate: z.string().trim().max(10).regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use YYYY-MM-DD").optional().nullable(),
  year: z.number().int().min(1870).max(2100),
  runtime: z.number().int().min(1).max(1000).optional().nullable(),
  imdbRating: z.number().min(0).max(10).optional().nullable(),
  ageRating: trimmed(10).optional().nullable(),
  posterUrl: optionalUrl,
  backdropUrl: optionalUrl,
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  genreIds: z.array(z.string().max(40)).max(10).default([]),
  cast: z.array(castSchema).max(60).default([]),
  sources: z.array(sourceSchema).max(10).default([]),
});
export type MovieInput = z.infer<typeof movieSchema>;

export const seriesSchema = z.object({
  title: trimmed(200).min(1, "Title is required"),
  slug: trimmed(80).regex(/^[a-z0-9-]*$/).optional(),
  description: trimmed(5000).min(1, "Description is required"),
  startYear: z.number().int().min(1870).max(2100),
  endYear: z.number().int().min(1870).max(2100).optional().nullable(),
  imdbRating: z.number().min(0).max(10).optional().nullable(),
  posterUrl: optionalUrl,
  backdropUrl: optionalUrl,
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  genreIds: z.array(z.string().max(40)).max(10).default([]),
});
export type SeriesInput = z.infer<typeof seriesSchema>;

export const seasonSchema = z.object({ number: z.number().int().min(0).max(200), title: trimmed(120).optional().nullable() });

export const episodeSchema = z.object({
  seasonId: z.string().max(40),
  number: z.number().int().min(0).max(1000),
  title: trimmed(200).min(1),
  description: trimmed(3000).optional().nullable(),
  runtime: z.number().int().min(1).max(1000).optional().nullable(),
  stillUrl: optionalUrl,
  sources: z.array(sourceSchema).max(10).default([]),
});

export const genreSchema = z.object({ name: trimmed(40).min(2) });

export const adminUserSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  disabled: z.boolean().optional(),
});

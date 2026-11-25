-- Each video source / history row belongs to exactly one movie or one episode.
ALTER TABLE "video_sources" ADD CONSTRAINT "video_sources_owner_check"
  CHECK (("movie_id" IS NOT NULL)::int + ("episode_id" IS NOT NULL)::int = 1);
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_owner_check"
  CHECK (("movie_id" IS NOT NULL)::int + ("episode_id" IS NOT NULL)::int = 1);
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_owner_check"
  CHECK (("movie_id" IS NOT NULL)::int + ("series_id" IS NOT NULL)::int = 1);
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_value_check" CHECK ("value" BETWEEN 1 AND 10);
ALTER TABLE "movies" ADD CONSTRAINT "movies_imdb_rating_check" CHECK ("imdb_rating" IS NULL OR "imdb_rating" BETWEEN 0 AND 10);
-- Case-insensitive title search
CREATE INDEX "movies_title_lower_idx" ON "movies" (lower("title"));
CREATE INDEX "series_title_lower_idx" ON "series" (lower("title"));
CREATE INDEX "actors_name_lower_idx" ON "actors" (lower("name"));

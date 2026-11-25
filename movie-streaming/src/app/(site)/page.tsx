import { Hero } from "@/components/media/Hero";
import { MediaRow, RowItem } from "@/components/media/MediaRow";
import { MovieCard } from "@/components/media/MovieCard";
import { ContinueCard } from "@/components/media/ContinueCard";
import { currentUser } from "@/lib/session";
import { featuredItems, moviesBy, moviesInGenre, recommendedMovies, trendingMovies, type CardItem } from "@/services/catalog";
import { continueWatching } from "@/services/library";

export const dynamic = "force-dynamic";

function Row({ title, items, href }: { title: string; items: CardItem[]; href?: string }) {
  return (
    <MediaRow title={title} href={href} count={items.length}>
      {items.map((m) => (
        <RowItem key={m.type + m.id}><MovieCard item={m} /></RowItem>
      ))}
    </MediaRow>
  );
}

export default async function HomePage() {
  const user = await currentUser();
  const [featured, trending, popular, recent, recommended, action, horror, comedy, scifi, drama, cont] = await Promise.all([
    featuredItems(),
    trendingMovies(),
    moviesBy([{ views: "desc" }]),
    moviesBy([{ createdAt: "desc" }]),
    recommendedMovies(user?.id),
    moviesInGenre("action"),
    moviesInGenre("horror"),
    moviesInGenre("comedy"),
    moviesInGenre("sci-fi"),
    moviesInGenre("drama"),
    user ? continueWatching(user.id) : Promise.resolve([]),
  ]);

  return (
    <>
      <Hero items={featured} />
      <div className="relative z-10 -mt-[6vh] space-y-2">
        {cont.length > 0 && (
          <MediaRow title={`Continue watching${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`} href="/profile" count={cont.length}>
            {cont.map((c) => (
              <RowItem key={c.key} wide><ContinueCard item={c} /></RowItem>
            ))}
          </MediaRow>
        )}
        <Row title="Trending now" items={trending} href="/movies?sort=popular" />
        <Row title="Most popular" items={popular} href="/movies?sort=popular" />
        <Row title="Recently added" items={recent} href="/recent" />
        <Row title={user ? "Recommended for you" : "Critics’ picks"} items={recommended} href="/movies?sort=rating" />
        <Row title="Action" items={action} href="/genres/action" />
        <Row title="Horror" items={horror} href="/genres/horror" />
        <Row title="Comedy" items={comedy} href="/genres/comedy" />
        <Row title="Sci-Fi" items={scifi} href="/genres/sci-fi" />
        <Row title="Drama" items={drama} href="/genres/drama" />
      </div>
    </>
  );
}

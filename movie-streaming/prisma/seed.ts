/**
 * Demo catalogue for development.
 *
 * Only openly licensed, public-domain or original material is used:
 *  - Blender Foundation open movies (CC BY) and classic films generally regarded as public domain in the
 *    United States. Public-domain status differs by country. These are seeded WITHOUT video sources:
 *    add sources you have verified (e.g. from the Blender Studio site) in the admin panel.
 *  - "Nocturne Test Reel" and the "Night Shift" demo series are original placeholder clips generated
 *    locally with ffmpeg (prisma/demo/media.ts) so playback, resume, subtitles, HLS and next-episode
 *    can be tested offline.
 * IMDb ratings are approximate demo values — verify them before going live.
 * Posters and backdrops are generated SVG artwork (prisma/demo/art.ts), not studio images.
 */
import { PrismaClient, type CreditRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { backdropSvg, posterSvg } from "./demo/art";
import { generateClips, hasFfmpeg } from "./demo/media";

const db = new PrismaClient();
const PUBLIC = path.join(process.cwd(), "public");

const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Family", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "History", "Musical"];

type Credit = [name: string, role: CreditRole, character?: string];
type DemoMovie = {
  title: string; year: number; runtime: number; rating: number; genres: string[]; tagline?: string;
  description: string; credits: Credit[]; featured?: boolean; sources?: { provider: "DIRECT"; ref: string; label: string; quality?: string; subtitles?: { language: string; label: string; url: string }[] }[];
  releaseDate?: string; ageRating?: string;
};

const MOVIES: DemoMovie[] = [
  {
    title: "Nocturne Test Reel", year: 2026, runtime: 2, rating: 7.0, genres: ["Animation", "Sci-Fi"], featured: true, ageRating: "All",
    tagline: "Ninety seconds of violet light, made for testing.",
    description: "An original placeholder clip generated for this demo: a slow violet gradient, a running timecode and a quiet tone. It ships with an MP4 source, an adaptive HLS source and English subtitles so every player feature can be tried. Replace it with your own content.",
    credits: [["Nocturne Studio", "DIRECTOR"]],
    sources: [
      { provider: "DIRECT", ref: "@mp4:test-reel", label: "MP4", quality: "720p", subtitles: [{ language: "en", label: "English", url: "/demo/subtitles/test-reel.en.vtt" }] },
      { provider: "DIRECT", ref: "@hls", label: "Adaptive (HLS)", quality: "Auto", subtitles: [{ language: "en", label: "English", url: "/demo/subtitles/test-reel.en.vtt" }] },
    ],
  },
  {
    title: "Sintel", year: 2010, runtime: 15, rating: 7.4, genres: ["Animation", "Fantasy", "Drama"], featured: true, releaseDate: "2010-09-27", ageRating: "12",
    tagline: "She searched the whole world for the dragon she had raised.",
    description: "A lone young woman named Sintel crosses snowfields, deserts and a walled city in search of Scales, the baby dragon she rescued and lost. The deeper she goes, the more the journey costs her — and the less the ending resembles the one she hoped for. The Blender Foundation's third open movie.",
    credits: [["Colin Levy", "DIRECTOR"], ["Halina Reijn", "ACTOR", "Sintel (voice)"], ["Thom Hoffman", "ACTOR", "Shaman (voice)"], ["Jan Morgenstern", "COMPOSER"]],
  },
  {
    title: "Tears of Steel", year: 2012, runtime: 12, rating: 6.4, genres: ["Sci-Fi", "Action"], releaseDate: "2012-09-26", ageRating: "12",
    tagline: "To save the world, they have to fix a breakup.",
    description: "In a future Amsterdam overrun by robots, a group of scientists and warriors stage a last stand on the Oude Kerk — betting everything on recreating one painful memory from the past. A live-action and visual-effects open movie by the Blender Foundation.",
    credits: [["Ian Hubert", "DIRECTOR"], ["Derek de Lint", "ACTOR", "Old Thom"], ["Sergio Hasselbaink", "ACTOR", "Barley"], ["Rogier Schippers", "ACTOR", "Thom"], ["Vanja Rukavina", "ACTOR", "Celia"], ["Denise Rebergen", "ACTOR", "Young Celia"], ["Joram Letwory", "COMPOSER"]],
  },
  {
    title: "Big Buck Bunny", year: 2008, runtime: 10, rating: 6.4, genres: ["Animation", "Comedy", "Family"], releaseDate: "2008-05-30", ageRating: "All",
    tagline: "Three bullies. One very large rabbit.",
    description: "A gentle giant of a rabbit enjoys a perfect spring morning — until three rodents decide to ruin it. Pushed too far, Big Buck plans an elaborate and very cartoonish revenge. The Blender Foundation's second open movie.",
    credits: [["Sacha Goedegebure", "DIRECTOR"], ["Jan Morgenstern", "COMPOSER"]],
  },
  {
    title: "Elephants Dream", year: 2006, runtime: 11, rating: 6.2, genres: ["Animation", "Sci-Fi", "Mystery"], releaseDate: "2006-03-24", ageRating: "12",
    tagline: "Two people. One machine. Two realities.",
    description: "Old Proog guides young Emo through the endless rooms of a strange mechanical world, insisting it is full of wonders. Emo sees only danger — and the gap between them grows wider with every door. The first open movie made with Blender.",
    credits: [["Bassam Kurdali", "DIRECTOR"], ["Tygo Gernandt", "ACTOR", "Proog (voice)"], ["Cas Jansen", "ACTOR", "Emo (voice)"], ["Jan Morgenstern", "COMPOSER"]],
  },
  { title: "Cosmos Laundromat", year: 2015, runtime: 12, rating: 7.1, genres: ["Animation", "Sci-Fi", "Comedy"], tagline: "First Cycle.", description: "On a desolate island, a suicidal sheep named Franck meets a quirky salesman who offers him the gift of a lifetime — a chance to live many lives. Franck soon learns the offer comes with consequences.", credits: [["Mathieu Auvray", "DIRECTOR"]] },
  { title: "Spring", year: 2019, runtime: 8, rating: 7.4, genres: ["Animation", "Fantasy"], description: "A shepherd girl and her dog face ancient spirits in order to continue the cycle of life — a wordless, painterly fable about loss and renewal.", credits: [["Andy Goralczyk", "DIRECTOR"]] },
  { title: "Sprite Fright", year: 2021, runtime: 10, rating: 7.1, genres: ["Animation", "Horror", "Comedy"], tagline: "Leave no trace.", description: "A group of rowdy teenagers on a woodland trip in 1980s Britain discover that the cute mushroom-dwelling sprites of the forest are far less friendly than they look.", credits: [["Matthew Luhn", "DIRECTOR"]] },
  { title: "Agent 327: Operation Barbershop", year: 2017, runtime: 4, rating: 7.4, genres: ["Animation", "Action", "Comedy"], description: "Agent 327 goes undercover in a barbershop that hides a secret laboratory — and an enemy who knows him far too well.", credits: [["Colin Levy", "DIRECTOR"], ["Hjalti Hjálmarsson", "DIRECTOR"]] },
  { title: "Hero", year: 2018, runtime: 4, rating: 6.8, genres: ["Animation", "Action", "Fantasy"], description: "A short showcase of Blender's 2D-in-3D Grease Pencil tools: a desert duel between a hero and a monster, told in bold strokes.", credits: [["Hjalti Hjálmarsson", "DIRECTOR"]] },

  { title: "Metropolis", year: 1927, runtime: 153, rating: 8.3, genres: ["Sci-Fi", "Drama"], featured: true, tagline: "The mediator between head and hands must be the heart.", description: "In a towering city of the future, the privileged sons of industry live in pleasure gardens while workers toil underground. When Freder falls for the workers' prophet Maria, he is drawn into a conflict that a mad inventor's machine threatens to turn into catastrophe.", credits: [["Fritz Lang", "DIRECTOR"], ["Thea von Harbou", "WRITER"], ["Brigitte Helm", "ACTOR", "Maria"], ["Alfred Abel", "ACTOR", "Joh Fredersen"], ["Gustav Fröhlich", "ACTOR", "Freder"]] },
  { title: "Nosferatu", year: 1922, runtime: 94, rating: 7.8, genres: ["Horror", "Fantasy"], description: "Estate agent Thomas Hutter travels to the Carpathians to sell a house to the mysterious Count Orlok — and unknowingly brings plague and shadow back to his hometown and his wife Ellen.", credits: [["F. W. Murnau", "DIRECTOR"], ["Max Schreck", "ACTOR", "Count Orlok"], ["Gustav von Wangenheim", "ACTOR", "Thomas Hutter"], ["Greta Schröder", "ACTOR", "Ellen Hutter"]] },
  { title: "The Cabinet of Dr. Caligari", year: 1920, runtime: 76, rating: 8.0, genres: ["Horror", "Mystery"], description: "A fairground hypnotist and his sleepwalking servant arrive in a small town just as a series of murders begins. Told through twisted, painted sets, it remains the landmark of German Expressionism.", credits: [["Robert Wiene", "DIRECTOR"], ["Werner Krauss", "ACTOR", "Dr. Caligari"], ["Conrad Veidt", "ACTOR", "Cesare"]] },
  { title: "Night of the Living Dead", year: 1968, runtime: 96, rating: 7.8, genres: ["Horror", "Thriller"], description: "Strangers barricade themselves inside a Pennsylvania farmhouse as the recently dead rise and close in. George A. Romero's low-budget debut rewrote the rules of the horror film.", credits: [["George A. Romero", "DIRECTOR"], ["Duane Jones", "ACTOR", "Ben"], ["Judith O'Dea", "ACTOR", "Barbra"]] },
  { title: "Carnival of Souls", year: 1962, runtime: 78, rating: 7.0, genres: ["Horror", "Mystery"], description: "After surviving a car accident, a church organist moves to a new town, where a pale, silent figure — and an abandoned lakeside pavilion — keep calling to her.", credits: [["Herk Harvey", "DIRECTOR"], ["Candace Hilligoss", "ACTOR", "Mary Henry"]] },
  { title: "The Phantom of the Opera", year: 1925, runtime: 93, rating: 7.5, genres: ["Horror", "Romance"], description: "A disfigured genius haunting the catacombs beneath the Paris Opera House becomes obsessed with a young soprano and will stop at nothing to make her a star.", credits: [["Rupert Julian", "DIRECTOR"], ["Lon Chaney", "ACTOR", "The Phantom"], ["Mary Philbin", "ACTOR", "Christine Daaé"]] },
  { title: "The Little Shop of Horrors", year: 1960, runtime: 72, rating: 6.2, genres: ["Comedy", "Horror"], description: "A clumsy flower-shop clerk breeds a strange plant that brings in customers — and develops a growing appetite for human blood.", credits: [["Roger Corman", "DIRECTOR"], ["Jonathan Haze", "ACTOR", "Seymour Krelboyne"], ["Jack Nicholson", "ACTOR", "Wilbur Force"]] },
  { title: "The General", year: 1926, runtime: 78, rating: 8.1, genres: ["Comedy", "Action", "Adventure"], featured: true, description: "When Union spies steal his beloved locomotive — with his sweetheart aboard — engineer Johnnie Gray gives chase alone, in one of the great stunt-driven comedies ever filmed.", credits: [["Buster Keaton", "DIRECTOR"], ["Clyde Bruckman", "DIRECTOR"], ["Buster Keaton", "ACTOR", "Johnnie Gray"], ["Marion Mack", "ACTOR", "Annabelle Lee"]] },
  { title: "Sherlock Jr.", year: 1924, runtime: 45, rating: 8.2, genres: ["Comedy", "Mystery"], description: "A projectionist who dreams of being a detective falls asleep at work and walks straight into the movie on screen.", credits: [["Buster Keaton", "DIRECTOR"], ["Buster Keaton", "ACTOR", "Projectionist"], ["Kathryn McGuire", "ACTOR", "The Girl"]] },
  { title: "The Kid", year: 1921, runtime: 68, rating: 8.2, genres: ["Comedy", "Drama", "Family"], description: "The Tramp finds an abandoned baby and raises him as his own — until the authorities decide the boy belongs elsewhere.", credits: [["Charlie Chaplin", "DIRECTOR"], ["Charlie Chaplin", "ACTOR", "The Tramp"], ["Jackie Coogan", "ACTOR", "The Kid"]] },
  { title: "His Girl Friday", year: 1940, runtime: 92, rating: 7.8, genres: ["Comedy", "Romance"], description: "A hard-boiled editor learns that his ex-wife and star reporter is about to remarry — and uses one last big story to win her back.", credits: [["Howard Hawks", "DIRECTOR"], ["Cary Grant", "ACTOR", "Walter Burns"], ["Rosalind Russell", "ACTOR", "Hildy Johnson"]] },
  { title: "Charade", year: 1963, runtime: 113, rating: 7.8, genres: ["Thriller", "Romance", "Comedy"], description: "After her husband is murdered, a woman in Paris is pursued by several men who want the fortune he stole — and helped by a charming stranger whose name keeps changing.", credits: [["Stanley Donen", "DIRECTOR"], ["Cary Grant", "ACTOR", "Peter Joshua"], ["Audrey Hepburn", "ACTOR", "Regina Lampert"]] },
  { title: "Detour", year: 1945, runtime: 68, rating: 7.2, genres: ["Crime", "Drama", "Thriller"], description: "A nightclub pianist hitchhiking to Los Angeles finds himself trapped by one fatal accident and a woman who knows exactly what happened.", credits: [["Edgar G. Ulmer", "DIRECTOR"], ["Tom Neal", "ACTOR", "Al Roberts"], ["Ann Savage", "ACTOR", "Vera"]] },
  { title: "D.O.A.", year: 1950, runtime: 83, rating: 7.2, genres: ["Crime", "Thriller", "Mystery"], description: "A man walks into a police station to report a murder — his own. Poisoned and with days to live, he races to find out who killed him and why.", credits: [["Rudolph Maté", "DIRECTOR"], ["Edmond O'Brien", "ACTOR", "Frank Bigelow"]] },
  { title: "The Hitch-Hiker", year: 1953, runtime: 71, rating: 7.1, genres: ["Thriller", "Crime"], description: "Two friends on a fishing trip pick up a stranger who turns out to be a killer, and are forced to drive him across the Mexican desert.", credits: [["Ida Lupino", "DIRECTOR"], ["Edmond O'Brien", "ACTOR", "Roy Collins"], ["Frank Lovejoy", "ACTOR", "Gilbert Bowen"]] },
  { title: "Scarlet Street", year: 1945, runtime: 102, rating: 7.7, genres: ["Crime", "Drama"], description: "A meek cashier and Sunday painter falls for a woman who, with her con-man boyfriend, sets out to exploit him — and his paintings.", credits: [["Fritz Lang", "DIRECTOR"], ["Edward G. Robinson", "ACTOR", "Christopher Cross"], ["Joan Bennett", "ACTOR", "Kitty March"]] },
  { title: "Battleship Potemkin", year: 1925, runtime: 75, rating: 7.9, genres: ["Drama", "History"], description: "The 1905 mutiny aboard the Russian battleship Potemkin and the massacre on the Odessa steps, told through some of the most influential editing in film history.", credits: [["Sergei Eisenstein", "DIRECTOR"]] },
  { title: "A Trip to the Moon", year: 1902, runtime: 13, rating: 8.1, genres: ["Sci-Fi", "Adventure", "Fantasy"], description: "A group of astronomers is fired from a cannon to the Moon, where they meet its strange inhabitants. Georges Méliès' landmark of early cinema.", credits: [["Georges Méliès", "DIRECTOR"]] },
  { title: "Royal Wedding", year: 1951, runtime: 93, rating: 6.6, genres: ["Musical", "Romance", "Comedy"], description: "A brother-and-sister dance act travels to London during the royal wedding of 1947, and both fall in love along the way.", credits: [["Stanley Donen", "DIRECTOR"], ["Fred Astaire", "ACTOR", "Tom Bowen"], ["Jane Powell", "ACTOR", "Ellen Bowen"]] },
  { title: "The Man with the Golden Arm", year: 1955, runtime: 119, rating: 7.2, genres: ["Drama", "Crime"], description: "A card dealer just out of prison tries to stay clean and become a jazz drummer, while old habits and old friends pull him back.", credits: [["Otto Preminger", "DIRECTOR"], ["Frank Sinatra", "ACTOR", "Frankie Machine"], ["Kim Novak", "ACTOR", "Molly"]] },
];

const VTT = `WEBVTT

00:00:01.000 --> 00:00:05.000
Welcome to the Nocturne test reel.

00:00:06.000 --> 00:00:11.000
Use the timeline, volume and fullscreen controls.

00:00:12.000 --> 00:00:18.000
Leave and come back: playback resumes where you stopped.

00:00:30.000 --> 00:00:36.000
Switch to the HLS source from the menu at the top right.

00:01:20.000 --> 00:01:28.000
Replace this clip with your own licensed content in the admin panel.
`;

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function writeArt(kind: "movie" | "series", s: string, art: Parameters<typeof posterSvg>[0]) {
  const dir = path.join(PUBLIC, "demo", kind);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${s}-poster.svg`), posterSvg(art));
  await writeFile(path.join(dir, `${s}-backdrop.svg`), backdropSvg(art));
  return { posterUrl: `/demo/${kind}/${s}-poster.svg`, backdropUrl: `/demo/${kind}/${s}-backdrop.svg` };
}

async function main() {
  await mkdir(path.join(PUBLIC, "demo", "subtitles"), { recursive: true });
  await writeFile(path.join(PUBLIC, "demo", "subtitles", "test-reel.en.vtt"), VTT);
  const media = hasFfmpeg() ? generateClips(PUBLIC) : null;
  if (!media) console.warn("ffmpeg not found: demo titles are seeded without playable sources.");
  const resolveRef = (ref: string) => (ref === "@hls" ? media!.hls : ref.startsWith("@mp4:") ? media!.mp4(ref.slice(5)) : ref);

  const genreIds = new Map<string, string>();
  for (const name of GENRES) {
    const g = await db.genre.upsert({ where: { slug: slug(name) }, update: { name }, create: { name, slug: slug(name) } });
    genreIds.set(name, g.id);
  }

  const created = new Map<string, string>();
  for (const [i, m] of MOVIES.entries()) {
    const s = slug(m.title);
    const director = m.credits.find((c) => c[1] === "DIRECTOR")?.[0];
    const art = await writeArt("movie", s, { title: m.title, year: m.year, credit: director, hue: (i * 47 + 250) % 360, motif: i });
    await db.movie.deleteMany({ where: { slug: s } });
    const cast = [];
    for (const [order, [name, role, character]] of m.credits.entries()) {
      const actor = await db.actor.upsert({ where: { name }, update: {}, create: { name } });
      cast.push({ actorId: actor.id, role, character: character ?? null, order });
    }
    const movie = await db.movie.create({
      data: {
        slug: s, title: m.title, tagline: m.tagline, description: m.description, year: m.year, runtime: m.runtime,
        imdbRating: m.rating, ageRating: m.ageRating, featured: !!m.featured,
        releaseDate: m.releaseDate ? new Date(m.releaseDate) : null,
        views: Math.round(5000 / (i + 1)) + (m.sources ? 2500 : 0),
        createdAt: new Date(Date.now() - i * 36 * 3600 * 1000),
        ...art,
        genres: { create: m.genres.map((g) => ({ genreId: genreIds.get(g)! })) },
        cast: { create: cast },
        sources: {
          create: (media ? m.sources ?? [] : []).map((src, idx) => ({
            provider: src.provider, ref: resolveRef(src.ref), label: src.label, quality: src.quality, isPrimary: idx === 0,
            subtitles: { create: src.subtitles ?? [] },
          })),
        },
      },
    });
    created.set(m.title, movie.id);
  }

  // An original demo series so seasons, episodes and "next episode" can be exercised end-to-end.
  for (const old of ["blender-open-movies", "night-shift"]) await db.series.deleteMany({ where: { slug: old } });
  const seriesSlug = "night-shift";
  const art = await writeArt("series", seriesSlug, { title: "Night Shift", year: 2026, credit: "Nocturne Studio", hue: 222, motif: 4 });
  const series = await db.series.create({
    data: {
      slug: seriesSlug, title: "Night Shift", startYear: 2026, imdbRating: 7.2, featured: true, ...art,
      description: "An original demo series of short placeholder episodes, generated for this project. Use it to try seasons, continue watching and the automatic next-episode countdown.",
      genres: { create: ["Sci-Fi", "Mystery"].map((g) => ({ genreId: genreIds.get(g)! })) },
      seasons: { create: [{ number: 1, title: "Demo season" }] },
    },
    include: { seasons: true },
  });
  const episodes = [
    ["The Blue Hour", "Episode one of the demo series. Forty seconds of deep blue."],
    ["Neon Rain", "Episode two. The palette shifts to magenta."],
    ["Last Train", "Episode three. Teal light before morning."],
  ] as const;
  for (const [n, [title, description]] of episodes.entries()) {
    await db.episode.create({
      data: {
        seasonId: series.seasons[0].id, number: n + 1, title, description, runtime: 1, airDate: new Date(`2026-0${n + 1}-01`),
        stillUrl: art.backdropUrl,
        sources: { create: media ? [{ provider: "DIRECT", ref: media.mp4(`night-shift-${n + 1}`), label: "MP4", quality: "720p", isPrimary: true }] : [] },
      },
    });
  }

  // Accounts
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const adminPass = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { email: adminEmail, name: "Site Admin", role: "ADMIN", passwordHash: await bcrypt.hash(adminPass, 12) },
  });
  const viewer = await db.user.upsert({
    where: { email: "viewer@example.com" },
    update: {},
    create: { email: "viewer@example.com", name: "Demo Viewer", passwordHash: await bcrypt.hash("Viewer123!", 12) },
  });
  const sintel = created.get("Nocturne Test Reel")!;
  await db.watchHistory.upsert({
    where: { userId_movieId: { userId: viewer.id, movieId: sintel } },
    update: {},
    create: { userId: viewer.id, movieId: sintel, positionSec: 34, durationSec: 90 },
  });
  for (const t of ["Metropolis", "Charade"]) {
    const movieId = created.get(t)!;
    await db.watchlistItem.upsert({ where: { userId_movieId: { userId: viewer.id, movieId } }, update: {}, create: { userId: viewer.id, movieId } });
  }

  console.log(`Seeded ${MOVIES.length} movies, 1 series (${episodes.length} episodes), ${GENRES.length} genres.`);
  console.log(`Admin: ${adminEmail} / ${process.env.SEED_ADMIN_PASSWORD ? "(from SEED_ADMIN_PASSWORD)" : adminPass}`);
  console.log("Viewer: viewer@example.com / Viewer123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

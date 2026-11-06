/**
 * Curated replacements only — never invent a feed URL.
 * Match by keyword in the dead feed's title/URL; if nothing matches, return [].
 */
export interface Replacement {
  title: string;
  url: string;
  topic: string;
}

const CURATED: Replacement[] = [
  { title: "Hacker News", url: "https://hnrss.org/frontpage", topic: "tech" },
  { title: "CSS-Tricks", url: "https://css-tricks.com/feed/", topic: "design" },
  { title: "Nature News", url: "https://www.nature.com/nature.rss", topic: "science" },
  { title: "The Verge", url: "https://www.theverge.com/rss/index.xml", topic: "tech" },
  { title: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed/", topic: "design" },
];

export function suggestReplacements(deadTitle: string, deadUrl: string): Replacement[] {
  const hay = `${deadTitle} ${deadUrl}`.toLowerCase();
  const topic = hay.includes("design") || hay.includes("css")
    ? "design"
    : hay.includes("science") || hay.includes("nature")
      ? "science"
      : "tech";
  return CURATED.filter((r) => r.topic === topic).slice(0, 2);
}

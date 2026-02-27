// ---------------------------------------------------------------------------
// Creator Categories
// ---------------------------------------------------------------------------

export interface Category {
  /** URL-safe identifier (used in routes and queries). */
  slug: string;
  /** Human-readable display name. */
  label: string;
  /** Short description shown on category pages. */
  description: string;
  /** Emoji or icon key for quick visual identification. */
  emoji: string;
}

export const categories: Category[] = [
  {
    slug: "modeling",
    label: "Modeling",
    description: "Professional and aspiring models sharing exclusive photoshoots and behind-the-scenes content.",
    emoji: "📸",
  },
  {
    slug: "fitness",
    label: "Fitness",
    description: "Workout routines, nutrition tips, and transformation journeys from fitness experts.",
    emoji: "💪",
  },
  {
    slug: "fashion",
    label: "Fashion",
    description: "Style guides, outfit inspiration, and fashion industry insights.",
    emoji: "👗",
  },
  {
    slug: "beauty",
    label: "Beauty",
    description: "Makeup tutorials, skincare routines, and beauty product reviews.",
    emoji: "💄",
  },
  {
    slug: "lifestyle",
    label: "Lifestyle",
    description: "Day-in-the-life content, productivity tips, and personal branding.",
    emoji: "✨",
  },
  {
    slug: "art",
    label: "Art",
    description: "Digital art, illustrations, paintings, and creative process walkthroughs.",
    emoji: "🎨",
  },
  {
    slug: "music",
    label: "Music",
    description: "Original tracks, production tutorials, and exclusive live sessions.",
    emoji: "🎵",
  },
  {
    slug: "dance",
    label: "Dance",
    description: "Choreography, dance tutorials, and performance videos.",
    emoji: "💃",
  },
  {
    slug: "cosplay",
    label: "Cosplay",
    description: "Costume creation, character transformations, and convention highlights.",
    emoji: "🎭",
  },
  {
    slug: "travel",
    label: "Travel",
    description: "Destination guides, travel vlogs, and hidden-gem recommendations.",
    emoji: "🌍",
  },
] as const;

/** All valid category slugs as a union type. */
export type CategorySlug = (typeof categories)[number]["slug"];

/** Lookup a category by its slug. Returns `undefined` if not found. */
export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

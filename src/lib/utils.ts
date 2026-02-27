import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";

// ---------------------------------------------------------------------------
// Class names
// ---------------------------------------------------------------------------

/**
 * Merges class names with Tailwind CSS conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Formats a price given in **cents** to a USD currency string.
 *
 * @example formatPrice(1999) // "$19.99"
 * @example formatPrice(0)    // "$0.00"
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Formats large numbers with abbreviated suffixes.
 *
 * @example formatNumber(1234)     // "1.2K"
 * @example formatNumber(3456789)  // "3.5M"
 * @example formatNumber(42)       // "42"
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return num.toString();
}

/**
 * Returns a human-friendly relative date string.
 *
 * - "Just now" / "X minutes ago" / "X hours ago" for today
 * - "Yesterday" for yesterday
 * - "Feb 27, 2026" for older dates
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (isToday(d)) {
    return formatDistanceToNow(d, { addSuffix: true });
  }
  if (isYesterday(d)) {
    return "Yesterday";
  }
  return format(d, "MMM d, yyyy");
}

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------

/**
 * Extracts up to two initials from a name.
 *
 * @example getInitials("John Doe")      // "JD"
 * @example getInitials("alice")          // "A"
 * @example getInitials("")               // "?"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 0 || parts[0] === "") {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Creates a URL-safe slug from arbitrary text.
 *
 * @example slugify("Hello World!")  // "hello-world"
 * @example slugify("  Foo & Bar ") // "foo-and-bar"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Suggests a username derived from an email address.
 *
 * Strips the domain, removes disallowed characters, and appends a short
 * random suffix to reduce collisions.
 *
 * @example generateUsername("jane.doe@example.com") // "janedoe_a3f"
 */
export function generateUsername(email: string): string {
  const local = email.split("@")[0] ?? "user";
  const base = local
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  const suffix = Math.random().toString(36).slice(2, 5);

  return `${base || "user"}_${suffix}`;
}

import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const stats = [
  { value: "10K+", label: "Creators" },
  { value: "$50M+", label: "Earned" },
  { value: "2M+", label: "Subscribers" },
];

const featuredCreators = [
  {
    name: "Seraphina Gold",
    handle: "@seraphina",
    category: "Digital Art",
    subscribers: "48.2K",
    avatar: "S",
    color: "from-amber-500 to-yellow-300",
  },
  {
    name: "Marcus Veil",
    handle: "@marcusveil",
    category: "Music Production",
    subscribers: "32.1K",
    avatar: "M",
    color: "from-violet-500 to-purple-300",
  },
  {
    name: "Luna Reyes",
    handle: "@lunareyes",
    category: "Photography",
    subscribers: "61.7K",
    avatar: "L",
    color: "from-rose-500 to-pink-300",
  },
  {
    name: "Dante Aurelius",
    handle: "@danteaurelius",
    category: "Fitness & Wellness",
    subscribers: "27.5K",
    avatar: "D",
    color: "from-emerald-500 to-green-300",
  },
  {
    name: "Aria Chen",
    handle: "@ariachen",
    category: "Cooking & Recipes",
    subscribers: "55.3K",
    avatar: "A",
    color: "from-orange-500 to-amber-300",
  },
  {
    name: "Kai Nomura",
    handle: "@kainomura",
    category: "Education",
    subscribers: "39.8K",
    avatar: "K",
    color: "from-sky-500 to-cyan-300",
  },
];

const steps = [
  {
    step: "01",
    title: "Create Your Profile",
    description:
      "Sign up in minutes. Showcase your brand with a stunning profile, bio, and custom cover imagery that captures your unique essence.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Set Your Tiers",
    description:
      "Define subscription tiers that reward your biggest fans. Offer exclusive content, behind-the-scenes access, and personalized perks.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Earn Monthly",
    description:
      "Get paid every month from your loyal subscriber base. Track your growth with real-time analytics and withdraw earnings instantly.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
];

const creatorBenefits = [
  {
    title: "Set Your Own Prices",
    description: "Full control over your subscription tiers and pricing strategy.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: "Keep 80% of Earnings",
    description: "Industry-leading revenue share. You earn more for your talent.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    title: "Analytics Dashboard",
    description: "Deep insights into subscriber growth, revenue, and engagement.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    title: "Instant Payouts",
    description: "Withdraw your earnings anytime to your preferred payment method.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
  },
  {
    title: "Built-in Messaging",
    description: "Connect directly with subscribers through our secure messaging system.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
  {
    title: "Content Scheduling",
    description: "Plan and schedule posts in advance to keep your audience engaged.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
];

const fanBenefits = [
  {
    title: "Exclusive Content",
    description: "Access premium posts, videos, and media you won't find anywhere else.",
  },
  {
    title: "Direct Messaging",
    description: "Chat one-on-one with your favourite creators through private messages.",
  },
  {
    title: "Support Your Favourites",
    description: "Directly fund the creators you love and help them keep creating.",
  },
  {
    title: "Early Access",
    description: "Be first to see new content, announcements, and exclusive drops.",
  },
  {
    title: "Community Access",
    description: "Join private communities of like-minded fans and superfans.",
  },
  {
    title: "Custom Perks",
    description: "Unlock special perks, shout-outs, and personalised experiences.",
  },
];

const testimonials = [
  {
    quote:
      "OnlyHalos completely transformed my creative career. I went from struggling freelancer to earning a six-figure income doing what I love. The platform is elegant and the community is incredible.",
    name: "Seraphina Gold",
    role: "Digital Artist & Illustrator",
    avatar: "S",
  },
  {
    quote:
      "As a subscriber, I've never felt closer to the creators I admire. The exclusive content is genuinely premium, and the direct messaging feature feels personal — not corporate. Worth every penny.",
    name: "James Mitchell",
    role: "Subscriber since 2024",
    avatar: "J",
  },
  {
    quote:
      "The 80% revenue share is unmatched. I switched from three other platforms and consolidated everything here. My earnings doubled in the first month. OnlyHalos just gets it.",
    name: "Luna Reyes",
    role: "Professional Photographer",
    avatar: "L",
  },
];

const footerLinks = {
  Platform: ["For Creators", "For Fans", "Pricing", "Features", "Blog"],
  Company: ["About", "Careers", "Press", "Contact", "Partners"],
  Resources: ["Help Center", "Community Guidelines", "Safety", "Creator Academy", "API"],
  Legal: ["Terms of Service", "Privacy Policy", "Cookie Policy", "DMCA"],
};

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ============================================================ */}
      {/*  NAVBAR                                                       */}
      {/* ============================================================ */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[hsl(48,100%,50%)]" />
              <div className="absolute inset-1 rounded-full border border-[hsl(48,100%,50%,0.3)]" />
              <div className="h-1.5 w-1.5 rounded-full bg-[hsl(48,100%,50%)]" />
            </div>
            <span className="text-lg font-bold tracking-wide">
              <span className="text-foreground">Only</span>
              <span className="text-[hsl(48,100%,50%)]">Halos</span>
            </span>
          </Link>

          {/* Nav links (hidden on mobile) */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#creators" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Creators
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              How It Works
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Testimonials
            </a>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[hsl(48,100%,50%)] px-4 py-2 text-sm font-semibold text-[hsl(240,6%,7%)] transition-all hover:bg-[hsl(48,100%,60%)] hover:shadow-lg hover:shadow-[hsl(48,100%,50%,0.2)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/*  HERO SECTION                                                 */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden pt-16">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          {/* Gold radial gradient */}
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[hsl(48,100%,50%,0.06)] blur-3xl" />
          {/* Secondary glow */}
          <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-[hsl(48,100%,50%,0.03)] blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(48,100%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(48,100%,50%) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[hsl(48,100%,50%,0.3)] bg-[hsl(48,100%,50%,0.08)] px-4 py-1.5 text-sm text-[hsl(48,100%,50%)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(48,100%,50%)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(48,100%,50%)]" />
              </span>
              The Premium Creator Platform
            </div>

            {/* Heading */}
            <h1 className="mb-6 font-[family-name:var(--font-playfair)] text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Where Icons{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-[hsl(48,100%,50%)] via-[hsl(45,100%,60%)] to-[hsl(48,100%,50%)] bg-clip-text text-transparent">
                  Shine
                </span>
                {/* Underline decoration */}
                <span className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-gradient-to-r from-transparent via-[hsl(48,100%,50%)] to-transparent opacity-60" />
              </span>
            </h1>

            {/* Sub-heading */}
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              The elite platform where iconic creators share exclusive content
              with their most dedicated fans. Build your empire, connect
              authentically, and earn what you deserve.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup?role=creator"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(48,100%,50%)] px-8 py-4 text-base font-semibold text-[hsl(240,6%,7%)] transition-all hover:bg-[hsl(48,100%,60%)] hover:shadow-xl hover:shadow-[hsl(48,100%,50%,0.25)]"
              >
                Join as Creator
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-[hsl(48,100%,50%,0.3)] hover:bg-secondary"
              >
                Start Exploring
              </Link>
            </div>

            {/* Halo decoration below CTA */}
            <div className="mx-auto mt-16 flex justify-center">
              <div className="relative h-40 w-40 sm:h-48 sm:w-48">
                <div className="absolute inset-0 animate-halo-spin rounded-full border-2 border-[hsl(48,100%,50%,0.4)]" />
                <div
                  className="absolute inset-4 animate-halo-spin rounded-full border-2 border-[hsl(48,100%,50%,0.2)]"
                  style={{ animationDirection: "reverse", animationDuration: "4s" }}
                />
                <div
                  className="absolute inset-8 animate-halo-spin rounded-full border border-[hsl(48,100%,50%,0.15)]"
                  style={{ animationDuration: "5s" }}
                />
                <div className="absolute inset-0 rounded-full bg-[hsl(48,100%,50%,0.03)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-halo-pulse h-6 w-6 rounded-full bg-[hsl(48,100%,50%,0.3)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STATS BAR                                                    */}
      {/* ============================================================ */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-[hsl(48,100%,50%)] sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURED CREATORS                                            */}
      {/* ============================================================ */}
      <section id="creators" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-widest text-[hsl(48,100%,50%)]">
              Featured Creators
            </span>
            <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground sm:text-4xl">
              Discover Extraordinary Talent
            </h2>
            <p className="text-lg text-muted-foreground">
              From digital artists to fitness coaches, explore a curated
              selection of the most popular creators on OnlyHalos.
            </p>
          </div>

          {/* Creator grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCreators.map((creator) => (
              <div
                key={creator.handle}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-[hsl(48,100%,50%,0.3)] hover:shadow-lg hover:shadow-[hsl(48,100%,50%,0.05)]"
              >
                {/* Cover gradient */}
                <div className={`h-28 bg-gradient-to-br ${creator.color} opacity-80`} />

                {/* Content */}
                <div className="relative px-6 pb-6">
                  {/* Avatar */}
                  <div className="-mt-10 mb-4 flex items-end justify-between">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-card bg-secondary text-2xl font-bold text-foreground">
                      {creator.avatar}
                    </div>
                    <span className="mb-1 rounded-full bg-[hsl(48,100%,50%,0.1)] px-3 py-1 text-xs font-medium text-[hsl(48,100%,50%)]">
                      {creator.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground">
                    {creator.name}
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {creator.handle}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {creator.subscribers}
                      </span>{" "}
                      subscribers
                    </span>
                    <span className="inline-flex items-center justify-center rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors group-hover:bg-[hsl(48,100%,50%)] group-hover:text-[hsl(240,6%,7%)]">
                      View Profile
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Browse all link */}
          <div className="mt-12 text-center">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(48,100%,50%)] transition-colors hover:text-[hsl(48,100%,60%)]"
            >
              Browse All Creators
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS                                                 */}
      {/* ============================================================ */}
      <section
        id="how-it-works"
        className="relative border-y border-border/50 bg-card/30 py-24 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-widest text-[hsl(48,100%,50%)]">
              How It Works
            </span>
            <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground sm:text-4xl">
              Start Earning in Three Steps
            </h2>
            <p className="text-lg text-muted-foreground">
              Getting started on OnlyHalos is simple. Set up, customize, and
              start building your subscriber base today.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((item, index) => (
              <div key={item.step} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-16 hidden h-px w-full bg-gradient-to-r from-[hsl(48,100%,50%,0.3)] to-transparent md:block" />
                )}

                <div className="relative rounded-2xl border border-border bg-card p-8 text-center transition-all hover:border-[hsl(48,100%,50%,0.3)]">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[hsl(48,100%,50%)] px-4 py-1 text-sm font-bold text-[hsl(240,6%,7%)]">
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div className="mx-auto mb-5 mt-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[hsl(48,100%,50%,0.1)] text-[hsl(48,100%,50%)]">
                    {item.icon}
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOR CREATORS                                                 */}
      {/* ============================================================ */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            {/* Left - Text */}
            <div>
              <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-widest text-[hsl(48,100%,50%)]">
                For Creators
              </span>
              <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground sm:text-4xl">
                Your Art. Your Rules.
                <br />
                Your Revenue.
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                OnlyHalos gives you the tools to monetize your passion with
                full creative control. No algorithms burying your content, no
                unfair revenue splits.
              </p>
              <Link
                href="/signup?role=creator"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(48,100%,50%)] px-6 py-3 text-sm font-semibold text-[hsl(240,6%,7%)] transition-all hover:bg-[hsl(48,100%,60%)] hover:shadow-lg hover:shadow-[hsl(48,100%,50%,0.25)]"
              >
                Start Creating
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Right - Benefits grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {creatorBenefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-xl border border-border bg-card p-5 transition-all hover:border-[hsl(48,100%,50%,0.3)]"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(48,100%,50%,0.1)] text-[hsl(48,100%,50%)]">
                    {benefit.icon}
                  </div>
                  <h3 className="mb-1 text-sm font-bold text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOR FANS                                                     */}
      {/* ============================================================ */}
      <section className="border-y border-border/50 bg-card/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            {/* Left - Benefits grid */}
            <div className="order-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:order-1">
              {fanBenefits.map((benefit, index) => (
                <div
                  key={benefit.title}
                  className="rounded-xl border border-border bg-card p-5 transition-all hover:border-[hsl(48,100%,50%,0.3)]"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(48,100%,50%,0.1)] text-lg font-bold text-[hsl(48,100%,50%)]">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mb-1 text-sm font-bold text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Right - Text */}
            <div className="order-1 lg:order-2">
              <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-widest text-[hsl(48,100%,50%)]">
                For Fans
              </span>
              <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground sm:text-4xl">
                Get Closer to the
                <br />
                Creators You Love
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Go beyond the public feed. Subscribe for exclusive access to
                premium content, private communities, and direct conversations
                with your favourite creators.
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-[hsl(48,100%,50%,0.3)] hover:bg-secondary"
              >
                Explore Creators
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                 */}
      {/* ============================================================ */}
      <section id="testimonials" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-widest text-[hsl(48,100%,50%)]">
              Testimonials
            </span>
            <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground sm:text-4xl">
              Loved by Creators & Fans
            </h2>
            <p className="text-lg text-muted-foreground">
              Don&apos;t just take our word for it. Hear from the people who
              make OnlyHalos special.
            </p>
          </div>

          {/* Testimonial cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-[hsl(48,100%,50%,0.3)]"
              >
                {/* Quote mark */}
                <div className="mb-4 text-4xl leading-none text-[hsl(48,100%,50%,0.3)]">
                  &ldquo;
                </div>

                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  {testimonial.quote}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(48,100%,50%,0.1)] text-sm font-bold text-[hsl(48,100%,50%)]">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>

                {/* Star rating */}
                <div className="mt-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-[hsl(48,100%,50%)]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FINAL CTA                                                    */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden border-t border-border/50 py-24 sm:py-32">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(48,100%,50%,0.05)] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          {/* Halo decoration */}
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 animate-halo-spin rounded-full border-2 border-[hsl(48,100%,50%,0.5)]" />
              <div className="absolute inset-2 rounded-full border border-[hsl(48,100%,50%,0.25)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-[hsl(48,100%,50%,0.4)]" />
              </div>
            </div>
          </div>

          <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Ready to Join the Elite?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
            Whether you&apos;re a creator ready to monetize your passion or a fan
            looking for exclusive content, your halo awaits.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(48,100%,50%)] px-10 py-4 text-base font-semibold text-[hsl(240,6%,7%)] transition-all hover:bg-[hsl(48,100%,60%)] hover:shadow-xl hover:shadow-[hsl(48,100%,50%,0.3)]"
            >
              Create Your Account
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-10 py-4 text-base font-semibold text-foreground transition-all hover:border-[hsl(48,100%,50%,0.3)] hover:bg-secondary"
            >
              Explore the Platform
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                       */}
      {/* ============================================================ */}
      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Top section */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="mb-4 flex items-center gap-2">
                <div className="relative flex h-7 w-7 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-[hsl(48,100%,50%)]" />
                  <div className="h-1 w-1 rounded-full bg-[hsl(48,100%,50%)]" />
                </div>
                <span className="text-base font-bold tracking-wide">
                  <span className="text-foreground">Only</span>
                  <span className="text-[hsl(48,100%,50%)]">Halos</span>
                </span>
              </Link>
              <p className="mb-6 text-sm text-muted-foreground">
                The premium platform where iconic creators shine.
              </p>
              {/* Social icons */}
              <div className="flex gap-3">
                {/* Twitter/X */}
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-[hsl(48,100%,50%,0.1)] hover:text-[hsl(48,100%,50%)]"
                  aria-label="Twitter"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-[hsl(48,100%,50%,0.1)] hover:text-[hsl(48,100%,50%)]"
                  aria-label="Instagram"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                {/* TikTok */}
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-[hsl(48,100%,50%,0.1)] hover:text-[hsl(48,100%,50%)]"
                  aria-label="TikTok"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </a>
                {/* YouTube */}
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-[hsl(48,100%,50%,0.1)] hover:text-[hsl(48,100%,50%)]"
                  aria-label="YouTube"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="mb-4 text-sm font-semibold text-foreground">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom section */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} OnlyHalos. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Terms
              </a>
              <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

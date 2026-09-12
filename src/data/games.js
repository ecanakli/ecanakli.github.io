import store from "./store-data.json";

// `store` holds verified App Store metadata (rating, dates, artwork).
// Everything below is the part a store page cannot tell you: what I owned.
//
// showRating is deliberate. A rating only appears when the sample is large
// enough to mean something — a title with six ratings is noise, not evidence.

export const games = [
  {
    ...store["love-eden"],
    studio: "United Tech (Noderno Limited)",
    years: "2025 — present",
    roleTitle: "Senior Unity Developer",
    showRating: true,
    playStore: "https://play.google.com/store/apps/details?id=com.noderno.loveeden",
    playInstalls: "100K+",
    playRating: "4.5",
    featured: true,
    summary:
      "A live interactive-romance game with a 260K-line Unity codebase, fully Addressables-driven " +
      "content delivered over Unity CCD, and always-on LiveOps.",
    owned: [
      "Save and cloud-data architecture — re-built on a title that was already live",
      "LiveOps seasonal event framework behind every campaign",
      "Subscriptions, battle pass, store and purchase flows",
      "Sign in with Apple, Google Sign-In, provider linking and account recovery",
      "LLM-powered AI companion chat, shipped to production",
      "Character customization and its addressable content pipeline",
      "Game-wide popup and notification queue, adopted project-wide",
    ],
    tech: ["StrangeIoC / MVCS", "Addressables", "Unity CCD", "PlayFab", "Firebase", "UniTask", "Unity IAP", "Naninovel", "AppsFlyer"],
  },
  {
    ...store["space-colony"],
    studio: "Veloxia Technology",
    years: "2021 — 2024",
    roleTitle: "Game Developer",
    showRating: true,
    summary:
      "An idle tap-miner that stayed live from 2019 to 2022 across sixteen planets, carrying a " +
      "full backend surface for an idle title of its size.",
    owned: [
      "Cloud save and cross-device progression",
      "Leaderboards and competitive progression surfaces",
      "LiveOps store content and remotely configured offers",
      "Monetization and analytics instrumentation end to end",
    ],
    tech: ["Unity", "C#", "Cloud Save", "Leaderboards", "LiveOps", "Firebase", "Unity IAP", "Ad Mediation"],
  },
  {
    ...store["shipping-life"],
    studio: "Veloxia Technology",
    years: "2021 — 2024",
    roleTitle: "Game Developer",
    showRating: false,
    summary:
      "An idle shipping-empire tycoon, and the project where the architecture mattered more than " +
      "the scope — built end to end on dependency injection with an entirely event-driven runtime.",
    owned: [
      "Full dependency-injection architecture across the whole title",
      "Event-driven runtime — systems communicate through events, not references",
      "Strategy pattern for interchangeable gameplay and economy behaviour",
      "Character animation driven by the objects the crew interacts with",
      "Monetization and analytics stack: IAP, ad mediation, Firebase, push",
    ],
    tech: ["Unity", "C#", "Dependency Injection", "Event-Driven", "Strategy Pattern", "Unity IAP", "Firebase"],
  },
  {
    ...store["match-monsters"],
    studio: "Veloxia Technology",
    years: "2021 — 2024",
    roleTitle: "Game Developer",
    showRating: false,
    summary:
      "A 3D match puzzle set in a household move, with monsters helping the player clear each room.",
    owned: [
      "Gameplay features and level content pipeline",
      "UI/UX flows across the title",
      "Monetization and analytics instrumentation",
    ],
    tech: ["Unity", "C#", "3D Match", "Level Pipeline", "Unity IAP", "Firebase"],
    needsDetail: true,
  },
  {
    ...store["money-dash"],
    studio: "Veloxia Technology",
    years: "2021 — 2024",
    roleTitle: "Game Developer",
    showRating: false,
    summary:
      "An idle banking tycoon — grow a single branch into a network that earns around the clock.",
    owned: [
      "Gameplay features and progression systems",
      "UI/UX flows across the title",
      "Monetization and analytics instrumentation",
    ],
    tech: ["Unity", "C#", "Idle Economy", "Unity IAP", "Firebase"],
    needsDetail: true,
  },
  {
    slug: "market-master",
    title: "Market Master: Idle Shopping",
    studio: "Veloxia Technology",
    years: "2021 — 2024",
    roleTitle: "Game Developer",
    genres: ["Simulation"],
    showRating: false,
    delisted: true,
    summary:
      "An idle shopping simulation, released on Google Play. Veloxia has since withdrawn its Android " +
      "catalogue, so the store listing is no longer public.",
    owned: [
      "Gameplay features and content pipeline",
      "UI/UX flows across the title",
      "Monetization and analytics instrumentation",
    ],
    tech: ["Unity", "C#", "Idle Economy", "Unity IAP", "Firebase"],
    needsDetail: true,
  },
];

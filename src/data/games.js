import store from "./store-data.json";

// `store` holds verified App Store metadata (rating, dates, artwork).
// Everything below is the part a store page cannot tell you: what I owned.
//
// showRating is deliberate. A rating only appears when the sample is large
// enough to mean something. A title with six ratings is noise, not evidence.

export const games = [
  {
    ...store["love-eden"],
    studio: "United Tech (Noderno Limited)",
    years: "2025–2026",
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
      "Save and cloud-data architecture, re-built on a title that was already live",
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
    years: "2021–2024",
    roleTitle: "Game Developer",
    showRating: true,
    summary:
      "An idle tap-miner that stayed live from 2019 to 2022 across sixteen planets, carrying a " +
      "backend surface most idle titles of its size never build.",
    owned: [
      "Cloud save and cross-device progression",
      "Leaderboards and competitive progression surfaces",
      "LiveOps store content and remotely configured offers",
      "Recurring seasonal events (Halloween, Christmas, Wheel of Fortune) as one repeatable pattern",
      "Monetization stack: Unity IAP, RevenueCat subscriptions, ad mediation across five networks",
      "Content delivery migrated onto Unity Addressables for load time and memory",
    ],
    tech: ["Unity", "C#", "Cloud Save", "Leaderboards", "LiveOps", "Addressables", "Unity IAP", "RevenueCat", "Firebase", "OneSignal"],
  },
  {
    ...store["shipping-life"],
    studio: "Veloxia Technology",
    years: "2021–2024",
    roleTitle: "Game Developer",
    showRating: false,
    summary:
      "An idle shipping-empire tycoon, and the project where the architecture mattered more than " +
      "the scope. Built end to end on dependency injection with an entirely event-driven runtime.",
    owned: [
      "Full dependency-injection architecture across the whole title, on Zenject",
      "Event-driven runtime: systems communicate through events, not references",
      "Strategy pattern for interchangeable gameplay and economy behaviour",
      "Character animation driven by the objects the crew interacts with",
      "Seasonal event systems reused across the studio's catalogue",
      "Monetization stack: Unity IAP, RevenueCat, five ad networks, Firebase, OneSignal",
    ],
    tech: ["Unity", "C#", "Zenject", "Event-Driven", "Strategy Pattern", "Addressables", "Unity IAP", "RevenueCat", "Firebase"],
  },
  {
    ...store["match-monsters"],
    studio: "Veloxia Technology",
    years: "2021–2024",
    roleTitle: "Game Developer",
    showRating: false,
    summary:
      "A 3D match puzzle set in a household move, with monsters helping the player clear each room.",
    owned: [
      "Gameplay features, UI/UX flows and the level content pipeline",
      "Monetization and analytics stack: Unity IAP, ad mediation, Firebase",
      "Seasonal event content on the studio's shared live-ops pattern",
    ],
    tech: ["Unity", "C#", "3D Match", "Level Pipeline", "Unity IAP", "Firebase"],
  },
  {
    ...store["money-dash"],
    studio: "Veloxia Technology",
    years: "2021–2024",
    roleTitle: "Game Developer",
    showRating: false,
    summary:
      "An idle banking tycoon. Grow a single branch into a network that earns around the clock.",
    owned: [
      "Gameplay features, progression systems and UI/UX flows",
      "Monetization and analytics stack: Unity IAP, ad mediation, Firebase",
      "Prototype through post-launch live operation",
    ],
    tech: ["Unity", "C#", "Idle Economy", "Unity IAP", "Firebase", "OneSignal"],
  },
];

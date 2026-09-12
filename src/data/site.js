export const profile = {
  name: "Emre Çanaklı",
  role: "Senior Unity Developer",
  location: "İzmir, Türkiye",
  // Deliberately not a job-hunting status. A portfolio outlives the search,
  // and a stale "open to work" line is worse than none.
  availability: "Remote, hybrid or relocation across EU / UK / Türkiye",
  email: "emrecanakli@gmail.com",
  github: "https://github.com/ecanakli",
  linkedin: "https://linkedin.com/in/ecanakli",
  cv: "/Emre_Canakli_Senior_Unity_Developer_CV.pdf",
};

export const intro =
  "I have been developing mobile games professionally for five years, working in teams on titles " +
  "shipped for iOS and Android. I work on the game itself, on mechanics, progression, UI and " +
  "content pipelines, and on the systems underneath it: save and cloud data, sign-in and account " +
  "recovery, remote content delivery, seasonal events and monetization. Most of my time goes to " +
  "what decides whether a title survives its first year, which is how it is structured, how fast " +
  "it runs on a cheap Android phone, and whether it can keep shipping content after release.";

// Only numbers a stranger can verify from a store page, or count off the shelf.
// Lines of code and commit counts were here once; they measure typing, not engineering.
export const metrics = [
  { value: "5+ yrs", label: "Professional experience", note: "Mobile games, since 2021" },
  { value: "5", label: "Shipped titles", note: "iOS and Android" },
  { value: "4.68★", label: "App Store rating", note: "Love Eden · 4,246 ratings" },
  { value: "100K+", label: "Google Play installs", note: "Love Eden" },
];

export const about = [
  "I'm a perfectionist, and it shows mostly in places nobody looks: the structure underneath a " +
    "feature, the edge case that hasn't happened yet, the code someone will have to read a year " +
    "from now. I'd rather build something once, properly, than three times quickly.",
  "I also use AI tooling heavily day to day, and I've shipped LLM features into production games.",
];

export const stack = [
  {
    group: "Engine & Language",
    items: ["C#", "Unity 2022 LTS", "Unity 6", "URP", "Shader Graph", "DOTween", "Unity Localization"],
  },
  {
    group: "Performance & Optimization",
    items: [
      "Unity Profiler",
      "Memory Profiler",
      "Frame Debugger",
      "Draw call & batch reduction",
      "SRP Batcher / GPU instancing",
      "Sprite atlasing",
      "Canvas & UI rebuild cost",
      "GC allocation elimination",
      "Object pooling",
      "Texture compression (ASTC / ETC2)",
      "LOD & occlusion culling",
      "Cold-start optimization",
      "IL2CPP & managed stripping",
      "Assembly definitions",
      "Build size reduction",
      "Low-end Android tuning",
    ],
  },
  {
    group: "Architecture",
    items: ["StrangeIoC (MVCS)", "Zenject", "Dependency injection", "Event-driven systems", "SOLID", "State machines", "Design patterns", "Unit testing"],
  },
  {
    group: "Content Delivery",
    items: ["Addressables", "Unity Cloud Content Delivery", "Multi-catalog remote content", "Asset-bundle deduplication", "UniTask / async"],
  },
  {
    group: "Backend & LiveOps",
    items: ["PlayFab", "Firebase", "Azure Functions", "Remote config", "A/B testing", "Cloud save", "REST APIs", "Save migration"],
  },
  {
    group: "Monetization & Growth",
    items: ["Unity IAP", "RevenueCat", "AppLovin MAX", "AdMob", "IronSource", "Admost", "AppsFlyer", "Amplitude", "OneSignal"],
  },
  {
    group: "Multiplayer",
    items: ["Netcode for GameObjects", "Mirror", "Client-server synchronization"],
  },
  {
    group: "Pipeline & Tooling",
    items: ["Custom Editor tooling", "Odin Inspector", "Git / Git LFS", "Jenkins", "Fastlane", "App Store Connect", "Google Play Console"],
  },
];

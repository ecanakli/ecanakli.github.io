export const profile = {
  name: "Emre Çanaklı",
  role: "Senior Unity Developer",
  location: "İzmir, Türkiye",
  availability: "Open to remote, hybrid and relocation across EU / UK / Türkiye",
  email: "emrecanakli@gmail.com",
  github: "https://github.com/ecanakli",
  linkedin: "https://linkedin.com/in/ecanakli",
  cv: "/Emre_Canakli_Senior_Unity_Developer_CV.pdf",
};

export const tagline = "Five years in Unity and C#. Five shipped mobile titles.";

export const intro =
  "I build mobile games in Unity. Five shipped titles on iOS and Android across two studios, " +
  "working from prototype to launch and staying on them afterwards — gameplay systems, client " +
  "architecture, UI, content pipelines and performance. Most of my time goes to the parts that " +
  "decide whether a game survives its first year: how it is structured, how fast it runs on a " +
  "cheap Android phone, and how it keeps shipping content after release.";

// Only numbers a stranger can verify from a store page, or count off the shelf.
// Lines of code and commit counts were here once; they measure typing, not engineering.
export const metrics = [
  { value: "5", label: "Shipped titles", note: "iOS and Android, since 2021" },
  { value: "4.68★", label: "App Store rating", note: "Love Eden · 4,246 ratings" },
  { value: "100K+", label: "Google Play installs", note: "Love Eden" },
  { value: "25+", label: "Live releases", note: "Rating held through every one" },
  { value: "5 yrs", label: "Unity in production", note: "Two studios, one engine" },
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
    items: ["C#", "Unity 2022 LTS", "Unity 6", "URP", "Shader Graph", "DOTween", "Cinemachine", "Unity Localization"],
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
    items: ["Netcode for GameObjects", "Mirror", "Client–server synchronization"],
  },
  {
    group: "Pipeline & Tooling",
    items: ["Custom Editor tooling", "Odin Inspector", "Git / Git LFS", "Jenkins", "Fastlane", "App Store Connect", "Google Play Console"],
  },
];

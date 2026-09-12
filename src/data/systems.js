// Deep-dive case studies. Full pages land in a later pass; these are the
// summaries the landing page lists.

export const systems = [
  {
    slug: "live-save-migration",
    number: "01",
    title: "Re-architecting save and cloud data on a game that was already live",
    context: "Love Eden · United Tech",
    hook:
      "Replacing persistence under a title with real players, then migrating every one of them " +
      "without losing a single save.",
    constraint: "Live players, no acceptable data loss, PlayFab write limits",
    outcome: "10 save domains on one serialization contract; a class of reinstall and account-switch data-loss bugs closed",
    tags: ["Save Architecture", "PlayFab", "Cloud Sync", "Migration"],
  },
  {
    slug: "liveops-event-framework",
    number: "02",
    title: "A LiveOps event framework that ships seasons without a client release",
    context: "Love Eden · United Tech",
    hook:
      "Halloween, Christmas, Valentine's, Black Friday and Summer all run on one reusable calendar, " +
      "mission and reward architecture driven by remote config.",
    constraint: "New themed content on a weekly cadence, no store review in the loop",
    outcome: "Seasonal campaigns ship as content, not as builds",
    tags: ["LiveOps", "Remote Config", "Content Pipeline", "PlayFab"],
  },
  {
    slug: "llm-companion-chat",
    number: "03",
    title: "Putting an LLM inside the gameplay loop",
    context: "Love Eden · United Tech",
    hook:
      "Per-character prompt and personality configuration, conversation memory, streamed responses " +
      "with cancellation, paywall gating, and an in-chat moderation and reporting flow.",
    constraint: "Real users, real latency, real moderation risk",
    outcome: "Generative AI shipped into a production game, not a prototype",
    tags: ["LLM Integration", "Streaming", "UniTask", "Moderation"],
  },
  {
    slug: "addressables-shared-dependencies",
    number: "04",
    title: "Cutting download size by fixing what the bundles duplicated",
    context: "Love Eden · United Tech",
    hook:
      "A shared-dependency Addressables group that stopped the same assets from shipping inside " +
      "several bundles at once, in a fully addressable pipeline delivered over Unity CCD.",
    constraint: "Multi-catalog remote content, on-demand updates, low-end Android memory",
    outcome: "Duplicated assets eliminated across bundles; download size and memory pressure down",
    tags: ["Addressables", "Unity CCD", "Memory", "Build Size"],
  },
];

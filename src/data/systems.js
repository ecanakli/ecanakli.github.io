// Deep-dive case studies. Each one is a page at /systems/<slug>.
//
// Everything here describes architecture and decisions, never source code.
// Numbers come from the shipped project.

export const systems = [
  {
    slug: "live-save-migration",
    number: "01",
    title: "Rebuilding the save layer of a game that was already live",
    game: "Love Eden",
    studio: "United Tech",
    year: "2025",
    context: "Love Eden · United Tech",
    hook:
      "Replacing persistence under a title with real players, then migrating every one of them " +
      "without losing a save.",
    constraint: "Live players, no acceptable data loss, PlayFab write limits",
    outcome:
      "13 save domains on one serialization contract; a class of reinstall and account-switch " +
      "data-loss bugs closed",
    tags: ["Save Architecture", "PlayFab", "Cloud Sync", "Migration"],
    stack: ["C#", "StrangeIoC", "PlayFab", "Newtonsoft.Json", "UniTask"],

    sections: [
      {
        heading: "The problem",
        body: [
          "Love Eden shipped with persistence written feature by feature. Each system had grown its own " +
            "save file, its own JSON settings and its own idea of when to write to the cloud. That works " +
            "until two of them disagree.",
          "They did disagree. The local store and the cloud store were serialized through different " +
            "settings, so a property that was skipped when it was null on one path was written as an " +
            "explicit null on the other. A property with a `new()` initializer would come back from the " +
            "cloud as null and overwrite a perfectly good default. Nothing crashed. The player just " +
            "found an emptier game than the one they left.",
          "The reinstall case was worse. A fresh install has no local data, so the client would fetch " +
            "whatever the cloud held and write its own empty state straight back over it. Reinstall and " +
            "account-switch data loss was a recurring production bug rather than an edge case.",
        ],
      },
      {
        heading: "What made it hard",
        body: [
          "The game was already live. There was no migration window, no maintenance mode and no version " +
            "of this work where existing players could be asked to start over. Every change had to land " +
            "on a weekly release that shipped to players who were mid-story.",
          "PlayFab's write limits ruled out the obvious approach of saving on every change. A busy " +
            "screen can mutate half a dozen save domains in a second.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "One generic base class, `DataManagementService<TData>`, that every save domain derives from. " +
            "It owns loading, migration, local persistence, cloud sync, debouncing and disposal. A feature " +
            "team writing a new save domain declares its data type, a file name and a cloud key, and " +
            "inherits correct behaviour for everything else.",
          "Thirteen domains run on it today: game progression, achievements, character customization, " +
            "player profile, mixed album, LiveOps events, date challenges, social stories, game settings, " +
            "collectable photos, matched characters, daily quests and episode progress.",
          "The single most important line in the whole system is a shared serializer configuration. Local " +
            "and cloud writes go through the same settings object, so the two stores cannot drift apart " +
            "by construction rather than by discipline.",
          "On top of that sits an integrity guard. Before any upload, a service is asked whether writing " +
            "its current state could destroy real data. If the service has ever been seen holding real " +
            "content and its in-memory payload now looks identical to a brand-new instance, the upload is " +
            "refused and the reason is logged. Cloud fetches report a typed outcome rather than a boolean, " +
            "so the login flow can tell \"the cloud is genuinely empty\" apart from \"the fetch failed\" " +
            "apart from \"I skipped this to protect local data\".",
          "Migration is detected rather than scheduled. Each save type carries a marker that flips true " +
            "once its own migration has run, which means a real save blob always differs from a pristine " +
            "one. That marker is deliberately ignored when comparing a payload against an empty instance, " +
            "otherwise every migrated-but-empty save would look like real content.",
        ],
        diagram: "save",
      },
      {
        heading: "Decisions and trade-offs",
        decisions: [
          {
            choice: "A generic base class every domain inherits",
            instead: "an interface each feature implements",
            because:
              "An interface would have let thirteen teams write thirteen slightly different cloud sync " +
              "implementations, which is the problem I was there to remove. Inheritance is the heavier " +
              "coupling, and it was the point: correctness lives in one file.",
          },
          {
            choice: "Debounced cloud writes, half a second, last write wins",
            instead: "writing on every change, or on a fixed timer",
            because:
              "Per-change writes blow through the API budget on any busy screen. A fixed timer adds " +
              "latency to quiet moments and still bursts on loud ones. Debouncing collapses a flurry of " +
              "mutations into one upload and leaves idle play alone.",
          },
          {
            choice: "Refuse a suspicious upload and log why",
            instead: "trusting the client's in-memory state",
            because:
              "The failure mode being prevented is silent and permanent. A refused upload costs one " +
              "stale cloud save, recoverable on the next real change. A wrong upload costs the player " +
              "their progress, and I cannot give it back.",
          },
          {
            choice: "Probe the local store before deciding on a restore",
            instead: "restoring from cloud whenever cloud data exists",
            because:
              "The question at login is not \"is there cloud data\" but \"would restoring it destroy " +
              "something\". That has to be answerable before the service initializes, so the probe reads " +
              "the persisted blob directly rather than the in-memory object, which is still a default at " +
              "that point.",
          },
          {
            choice: "Type names excluded from the serialized payload",
            instead: "Newtonsoft's type handling for polymorphic data",
            because:
              "Type name handling breaks under IL2CPP on iOS once the linker has had its way. Saves that " +
              "work in the editor and fail on device are the worst possible bug to find late.",
          },
        ],
      },
      {
        heading: "Result",
        body: [
          "Thirteen save domains share one serialization contract across local and cloud storage, so the " +
            "two can no longer silently diverge. The reinstall and account-switch data-loss class was " +
            "closed: an empty client can no longer overwrite a populated cloud save.",
          "Every existing player was migrated in place, on a normal weekly release, without a reset and " +
            "without a support queue full of lost progress.",
          "A separate corrupted-save path handles what is left: detection, a player-facing recovery " +
            "prompt, and analytics on both, so a save problem in production is visible rather than " +
            "inferred from reviews.",
        ],
      },
      {
        heading: "What I would do differently",
        body: [
          "The migration marker is discovered by reflection on each save type, cached once per closed " +
            "generic. It works, and the cost is paid a single time, but it is a convention enforced by a " +
            "string rather than the compiler. A required interface member would have cost one line per " +
            "save type and removed a whole category of \"why did this type not migrate\" questions.",
        ],
      },
    ],
  },

  {
    slug: "multi-catalog-addressables",
    number: "02",
    title: "Splitting 7,000 addressable entries into catalogs that load when they are needed",
    game: "Love Eden",
    studio: "United Tech",
    year: "2025",
    context: "Love Eden · United Tech",
    hook:
      "A boot catalog of 137 entries instead of 7,140, with story, photo and auxiliary content " +
      "loaded additively on the trigger that actually needs it.",
    constraint: "Cold start on low-end Android, remote content over Unity CCD, no store release per update",
    outcome: "Startup parses ~200KB of catalog instead of the entire content graph",
    tags: ["Addressables", "Unity CCD", "Cold Start", "Memory"],
    stack: ["Unity Addressables", "Unity Cloud Content Delivery", "UniTask", "C#"],

    sections: [
      {
        heading: "The problem",
        body: [
          "Love Eden is fully addressable. Every story script, character, background, avatar, photo and " +
            "UI asset is delivered remotely through Unity Cloud Content Delivery so that new content can " +
            "ship without a store release.",
          "The cost of that is a catalog. Addressables parses its content catalog during initialization, " +
            "before the game can do anything, and the whole catalog is parsed whether or not the player " +
            "will ever open the screen that needs it. With more than seven thousand entries, a narrative " +
            "game with a large photo library pays that bill on every cold start, on every device, " +
            "including the cheap Android phones that make up a meaningful share of the install base.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "The content is split into four catalog domains, each a separate catalog file that can be " +
            "loaded independently and additively.",
          "Boot holds what the game cannot start without: UI, fonts, databases and core narrative " +
            "infrastructure. Around 137 entries, roughly 200KB. It is the only catalog loaded during " +
            "Addressables initialization.",
          "Narrative content, about 2,521 entries of scripts, characters, backgrounds and avatars, loads " +
            "the first time a player opens a chat or a date. Photos, the largest domain at about 4,170 " +
            "entries, loads when a player opens an album, a profile or a gallery. Auxiliary content, " +
            "about 312 entries covering customization, offers, voice messages and AI chat settings, " +
            "loads quietly in the background after login.",
          "A catalog loader owns the additive load, deduplicates in-flight requests so two screens asking " +
            "for the same domain do not fetch it twice, and exposes the domains as a typed enum rather " +
            "than string keys. Deferred domains are triggered by a command, so the decision about when " +
            "to warm a domain lives in the flow that knows, not inside the loader.",
          "Underneath, a shared-dependency Addressables group holds assets referenced from more than one " +
            "place, so the same texture is not duplicated into several bundles.",
        ],
        diagram: "catalogs",
      },
      {
        heading: "Decisions and trade-offs",
        decisions: [
          {
            choice: "Four domains drawn along user-flow lines",
            instead: "one catalog per feature, or per bundle",
            because:
              "Domains are only useful if a single trigger warms everything that trigger needs. Splitting " +
              "any finer means a chat open would have to load six catalogs and wait for all of them, " +
              "which trades a startup cost for a worse in-session one.",
          },
          {
            choice: "Photos as their own domain rather than part of narrative content",
            instead: "bundling them with the story assets that reference them",
            because:
              "Photos are the largest domain by a wide margin and a large share of players never open " +
              "the full gallery. Loading them with the story would put the biggest catalog behind the " +
              "most common trigger.",
          },
          {
            choice: "Auxiliary loaded in the background after login",
            instead: "on demand like the other deferred domains",
            because:
              "It is small, and the screens it serves are entered abruptly from anywhere. Paying 312 " +
              "entries during a moment the player is already waiting is cheaper than a visible hitch " +
              "when they tap a customization button.",
          },
          {
            choice: "A typed enum for domains",
            instead: "string catalog identifiers",
            because:
              "Content keys are the kind of thing that gets typo'd once and fails only on a remote " +
              "build, in a specific environment, three days after the release. The compiler should be " +
              "able to answer that question.",
          },
        ],
      },
      {
        heading: "Result",
        body: [
          "Startup parses a 137-entry catalog rather than the full 7,140-entry content graph, and the " +
            "rest arrives on the trigger that needs it. Download size and memory pressure dropped further " +
            "once shared dependencies stopped being duplicated across bundles.",
          "Because catalogs are remote and multi-catalog, content updates continue to ship without a " +
            "client release, which is the property the whole live-content operation depends on.",
        ],
      },
    ],
  },

  {
    slug: "liveops-event-framework",
    number: "03",
    title: "A LiveOps framework that ships a season without a client release",
    game: "Love Eden",
    studio: "United Tech",
    year: "2025",
    context: "Love Eden · United Tech",
    hook:
      "Halloween, Christmas, Valentine's, St Patrick's, Summer and a battle pass, all running on one " +
      "event core with remotely configured content.",
    constraint: "Seasonal content on a weekly cadence, no store review in the loop",
    outcome: "Themed campaigns ship as configuration and assets, not as builds",
    tags: ["LiveOps", "Remote Config", "Battle Pass", "Content Pipeline"],
    stack: ["C#", "StrangeIoC", "PlayFab", "Addressables", "Remote Config"],

    sections: [
      {
        heading: "The problem",
        body: [
          "A live game's calendar does not wait for app review. Halloween happens on a date, and a " +
            "campaign that needs a client build to go live is a campaign that can be lost to a rejected " +
            "submission or a slow review.",
          "The first seasonal events were built as features. Each one had its own screens, its own " +
            "progression tracking and its own reward logic, and each one was a new release. Shipping the " +
            "second one taught us that we were going to write the same event five times a year forever.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "An event core that the themed packages sit on top of. The core owns the parts that never " +
            "change between a Halloween candy hunt and a Valentine's campaign: the event database, " +
            "activity windows, per-player progress, active-transaction tracking and the rules for which " +
            "event is allowed to interrupt the player next.",
          "Two event shapes cover the catalogue. Special sales are windowed offers with a start, an end " +
            "and a completion state. Endless offers are stepped progressions the player claims through " +
            "one item at a time. Everything seasonal is one of those two with different content behind it.",
          "The seasonal packages, Halloween, Christmas, Valentine's, St Patrick's, Summer and the Love " +
            "Pass battle pass, contribute art, copy and configuration rather than systems. The core " +
            "spawns their shop banners and icon buttons into the surfaces that ask for them, so a new " +
            "event appears in the store and on the home screen without either of those screens knowing " +
            "the event exists.",
          "Event progress is a save domain like any other, which means it inherits the cloud sync, the " +
            "debounce and the integrity guard from the save architecture rather than reimplementing them.",
          "Presentation goes through the game-wide popup queue. Events do not open their own windows; " +
            "they offer popup data to a priority-based scheduler that decides what the player sees and " +
            "when, so three concurrent campaigns cannot all seize the screen after login.",
        ],
        diagram: "liveops",
      },
      {
        heading: "Decisions and trade-offs",
        decisions: [
          {
            choice: "Two event shapes, not a general-purpose event engine",
            instead: "a fully data-driven system that can express any campaign",
            because:
              "A general engine would have been a scripting language nobody on the team wanted to learn, " +
              "and every real campaign for two years fit one of two shapes. Narrow abstractions that " +
              "cover the actual cases beat broad ones that cover the imagined ones.",
          },
          {
            choice: "Events offer popup data to a queue",
            instead: "events opening their own UI when they become active",
            because:
              "Every system that can open a window will eventually open one at the same moment as three " +
              "others. Making that a scheduling problem with explicit priorities means the collision is " +
              "designed rather than discovered in production.",
          },
          {
            choice: "Event progress stored as a normal save domain",
            instead: "a bespoke store for event state",
            because:
              "Event progress is player progress. Giving it its own persistence path would have put " +
              "campaign rewards outside the integrity guard, which is precisely the data you cannot " +
              "afford to lose during a paid campaign.",
          },
        ],
      },
      {
        heading: "Result",
        body: [
          "Seasonal campaigns became a content job. A new themed event ships with assets and remote " +
            "configuration on the existing release, and the client code that runs it is the code that " +
            "ran the last five.",
          "The same core carries the Love Pass battle pass and recurring commercial events, so " +
            "monetization surfaces and seasonal content share one progression and reward model instead " +
            "of two.",
        ],
      },
    ],
  },

  {
    slug: "llm-companion-chat",
    number: "04",
    title: "Putting a language model inside the gameplay loop",
    game: "Love Eden",
    studio: "United Tech",
    year: "2026",
    context: "Love Eden · United Tech",
    hook:
      "Per-character personality, conversation memory, streamed replies with cancellation, a paywall " +
      "on the meter and a moderation path, shipped to players rather than demoed.",
    constraint: "Real users, real latency, real moderation risk, per-token cost",
    outcome: "Generative AI running in a production game with a live audience",
    tags: ["LLM Integration", "Streaming", "Moderation", "UniTask"],
    stack: ["C#", "UniTask", "OpenRouter", "StrangeIoC", "PlayFab"],

    sections: [
      {
        heading: "The problem",
        body: [
          "Love Eden is a narrative game, and its story content is authored. An AI companion chat is the " +
            "opposite: unbounded, unscripted and generated at request time. Putting one inside a shipped " +
            "romance game raises four problems at once, and none of them is the model call.",
          "The character has to stay in character. The conversation has to remember what was said. The " +
            "feature has to cost less than it earns. And a system that generates text to real users needs " +
            "a path for when that text is wrong.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "Character personality is configuration, not code. Each character carries its own prompt and " +
            "behaviour settings, authored alongside the rest of its content, so writers tune a character's " +
            "voice without an engineer in the loop.",
          "A memory service assembles the context for each request. A chat is not a stateless prompt: it " +
            "carries what the player and the character have already established, within a budget, because " +
            "context is the thing you pay for.",
          "Requests go through a gateway service rather than direct to one vendor, with a pricing service " +
            "alongside it. Model choice is an operational decision, and the cost of a conversation is " +
            "something the business needs to see per model rather than discover in a monthly invoice.",
          "Responses stream. A language model answering in one block after several seconds reads as a " +
            "frozen game, so replies arrive token by token into a chat bubble, and every request is " +
            "cancellable. If the player leaves the screen mid-answer, the request is cancelled and torn " +
            "down rather than left to complete into a view that no longer exists.",
          "Access is gated by a paywall service tied to subscription state, and an in-chat reporting flow " +
            "lets a player flag a response. That path exists because the alternative is finding out from " +
            "a store review.",
        ],
        diagram: "aichat",
      },
      {
        heading: "Decisions and trade-offs",
        decisions: [
          {
            choice: "A gateway in front of the model, not a direct vendor SDK",
            instead: "integrating one provider's client library",
            because:
              "Model pricing and quality move faster than app releases. Routing through a gateway makes " +
              "switching a configuration change, and makes per-model cost visible while the feature is " +
              "live rather than after it.",
          },
          {
            choice: "Streamed responses with hard cancellation",
            instead: "awaiting the full completion",
            because:
              "Perceived latency is the whole experience for a chat feature. Streaming also forces the " +
              "cancellation question to be answered properly, which is what stops a half-finished reply " +
              "from writing into a destroyed view when the player backs out.",
          },
          {
            choice: "Personality as authored content",
            instead: "prompts embedded in code",
            because:
              "Writers own character voice. Anything they cannot change without a build will either stay " +
              "wrong or turn an engineer into a bottleneck on every tuning pass.",
          },
          {
            choice: "A subscription gate on the feature",
            instead: "free access with a rate limit",
            because:
              "Every message has a real marginal cost. A rate limit caps the damage but does not pay for " +
              "it, and a feature that loses money per engaged user is a feature that gets cut.",
          },
          {
            choice: "In-product reporting from day one",
            instead: "adding moderation tooling after launch",
            because:
              "A generative feature will produce something it should not have. Shipping without a path " +
              "for that is a decision to hear about it publicly first.",
          },
        ],
      },
      {
        heading: "Result",
        body: [
          "The companion chat shipped into a live title with a real audience, gated behind subscription " +
            "and instrumented for cost, engagement and reports.",
          "The part worth keeping is not the model call. It is that character voice is content, cost is " +
            "measured per model, cancellation is handled properly, and there is a route for the answers " +
            "that come out wrong.",
        ],
      },
    ],
  },
];

export const getSystem = (slug) => systems.find((s) => s.slug === slug);

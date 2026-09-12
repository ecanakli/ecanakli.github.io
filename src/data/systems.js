// Deep-dive case studies. Each one is a page at /systems/<slug>.
//
// Architecture and decisions only, never source code.
//
// Editing rule: a reader is deciding whether to interview me. Keep what shows
// engineering judgement — the problem, the constraint, the trade-off, the
// measured improvement. Cut internal forensics. If a paragraph would only
// matter to someone maintaining the system, it belongs in the handover doc,
// not here.

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
      "Eleven services on one base class, seventeen cloud keys collapsed into one, and every " +
      "existing player migrated in place on a normal weekly release.",
    constraint: "Live players, no acceptable data loss, a hard 10-key PlayFab write limit",
    outcome: "85%+ fewer cloud API calls, save latency down from 500–2000ms to 100–300ms",
    tags: ["Save Architecture", "PlayFab", "Cloud Sync", "Migration"],
    stack: ["C#", "StrangeIoC", "PlayFab", "Newtonsoft.Json", "UniTask"],

    sections: [
      {
        heading: "The problem",
        body: [
          "Persistence had been written feature by feature. Every system had its own save file, its own " +
            "JSON settings and its own idea of when to write to the cloud, and a background command " +
            "uploaded everything every ten seconds for every player whether anything had changed or not. " +
            "Keys had multiplied: one per character for photos and voice messages, seventeen for the " +
            "player profile alone, each one its own API call.",
          "Worse, the local and cloud paths used different serializer settings, so a field with a " +
            "`new()` initializer came back from the cloud as null and overwrote a good default. Nothing " +
            "crashed. The player just found an emptier game than the one they left. And with no write " +
            "ordering, a device holding a stale copy could overwrite newer progress from another device.",
          "The game was already live, so there was no migration window and no version of this work where " +
            "existing players could be asked to start over.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "One generic base class that every save domain derives from, owning load, migration, local " +
            "persistence, cloud sync, debouncing and disposal. A feature team adding a save domain " +
            "declares a data type, a file name and a cloud key, and inherits correct behaviour for the " +
            "rest. Eleven services run on it; nine sync to the cloud.",
          "Local and cloud writes share one serializer configuration, so the two stores cannot drift " +
            "apart by construction rather than by discipline. Keys were consolidated hard: the profile's " +
            "seventeen became one, per-character photo and voice keys became one each with an in-memory " +
            "cache giving O(1) state checks instead of string work on every read, and story progress " +
            "moved to a compact format at roughly 250 bytes per character.",
          "Cloud sync now activates on provider login instead of on a timer, and only for players who " +
            "have actually linked an account. Guests stay local-only and cost nothing.",
          "Two guards sit in front of every upload. An integrity guard refuses to write a payload that " +
            "looks like a fresh instance when the service is known to have held real content. A version " +
            "envelope carries a write counter and the identity of the install that produced the copy, so " +
            "the newer copy always wins and a stale device is refused rather than allowed to overwrite.",
        ],
        diagram: "save",
      },
      {
        heading: "Before and after",
        table: {
          head: ["", "Before", "After"],
          rows: [
            ["Save frequency", "Every 10 seconds, all players", "Provider login, once per session"],
            ["Player profile keys", "17 separate keys", "1 consolidated key"],
            ["API calls per save", "17+ separate calls", "1–8 batched calls"],
            ["Save latency", "500–2000 ms", "100–300 ms"],
          ],
        },
        body2: [
          "The envelope nearly sank it. Nine synced services plus nine per-service envelope keys came to " +
            "eighteen keys per write request, and PlayFab allows ten. Every write was rejected, but " +
            "reads have no such limit, so everything still loaded and nothing looked broken. Collapsing " +
            "the envelope into one account-level key brought it to exactly ten. That budget is now full, " +
            "which is a documented constraint for the next engineer rather than a surprise.",
        ],
      },
      {
        heading: "Decisions and trade-offs",
        decisions: [
          {
            choice: "A generic base class every domain inherits",
            instead: "an interface each feature implements",
            because:
              "An interface would have let eleven teams write eleven slightly different cloud sync " +
              "implementations, which is the problem I was there to remove. Inheritance is the heavier " +
              "coupling, and it was the point: correctness lives in one file.",
          },
          {
            choice: "Refuse the upload when the cloud copy is newer",
            instead: "forcing the write through by bumping the counter past the cloud's",
            because:
              "An earlier version of the fix did exactly that, and I removed it in review. In a genuine " +
              "conflict, forcing the write destroys the other device's data with no evidence ours is the " +
              "better copy. Refusing preserves the cloud, the next fetch updates the device, and no lock " +
              "forms.",
          },
          {
            choice: "Do not pull the cloud copy when local data already exists",
            instead: "restoring from cloud whenever cloud data is present",
            because:
              "Only the login-time batch upload writes progress to the cloud, so the local copy can " +
              "never be older than the cloud copy. Fetching would overwrite newer local progress with " +
              "an older cloud one. The rule follows from the invariant, not from intuition.",
          },
          {
            choice: "A partial fetch counts as failure",
            instead: "treating any restored service as success",
            because:
              "Success is what triggers clearing local story saves. Under the old rule, one service out " +
              "of eight restoring was enough to wipe story progress.",
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
          "Because every service records a write counter and a writer identity, a save incident is now " +
            "diagnosable from the device alone. That is how one \"my whole session vanished\" report " +
            "turned out to affect every player who had ever reinstalled the app: identity is generated " +
            "per install, so a reinstall looked like a second device writing concurrently and uploads " +
            "were refused indefinitely while local saving carried on looking normal. Affected devices " +
            "recover by themselves on the fixed build, with no migration and no support action.",
          "Every existing player was migrated in place, on a normal weekly release, without a reset.",
        ],
      },
      {
        heading: "What I would change",
        body: [
          "A cloud save replaces the whole payload rather than merging fields, so one account on two " +
            "devices running different app versions can lose a field the older build does not know " +
            "about. The mitigation only helps if it is already in the build doing the damaging write, " +
            "which means shipping it protects future fields and not current ones. That is worth knowing " +
            "before designing a schema, not after.",
        ],
      },
    ],
  },

  {
    slug: "account-switching",
    number: "02",
    title: "The account switch that was copying data instead of switching",
    game: "Love Eden",
    studio: "United Tech",
    year: "2026",
    context: "Love Eden · United Tech",
    hook:
      "The game could only hold one backend account per device, so signing in with a second email " +
      "copied that account's data over yours. The correct entry point had existed all along.",
    constraint: "A live account system, real progress at stake, and iOS will not let an app relaunch itself",
    outcome: "Multiple accounts per device, each keeping its own progress, plus six unrelated login defects closed",
    tags: ["Authentication", "PlayFab", "Account Recovery", "Refactoring"],
    stack: ["C#", "PlayFab", "Sign in with Apple", "Google Sign-In", "StrangeIoC"],

    sections: [
      {
        heading: "The problem",
        body: [
          "Signing in with a second email was supposed to switch accounts. What it did was copy the other " +
            "account's data into the account already on the device, delete story progress as part of the " +
            "process, and unlink the email on sign-out so the account lost its owner. Support had been " +
            "seeing the symptoms for a long time without a diagnosis: progress that appeared to vanish, " +
            "accounts that kept getting new IDs, story progress deleted as the price of signing in.",
          "The cause was one call. The backend keeps its own record of who the current player is, " +
            "separate from the login session, and an earlier attempt at real switching had logged into " +
            "the new account directly, bypassing the backend's own login entry point. The session said " +
            "account B while the backend still said account A, so every backend feature broke at once: " +
            "empty store, unbuyable gems, inventory and profile disagreeing.",
          "Faced with that, the original team stopped switching identities and copied the data instead, " +
            "and the reasoning is written into the old code. Given what was known then it was a " +
            "reasonable call. The constraint just turned out to be a function that had never been called.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "Four rules hold it together. Identity is decided at launch, not mid-session. The backend is " +
            "always entered through its own login door, so its record of who is playing is never wrong. " +
            "Switching means save, write the switch to disk, reset local state, sign into the target: " +
            "nothing is copied and nothing is transferred. And the disk record is what guarantees " +
            "correctness, not the restart, so a failed restart still lands on the right account at the " +
            "next launch.",
          "Switching requires a full reinitialise and iOS does not let an app relaunch itself, so the " +
            "game performs an in-place restart: it tears everything down and re-runs its own startup " +
            "sequence behind the normal loading screen. To the player it looks like a load.",
          "When the email belongs to another account, the player gets both accounts side by side with " +
            "name, gem balance, progress and the real avatar, rebuilt layer by layer from that account's " +
            "saved look. Then they choose: switch, and the app restarts into it, or stay, and the email " +
            "attaches to the account they are already playing. The second option is irreversible, so it " +
            "only happens on an explicit choice.",
          "Six further defects came out of the same work, most of them affecting players who never touch " +
            "account switching: signing in could write your data into someone else's account, Google " +
            "asked for consent three times, signing out unlinked the email, every network retry silently " +
            "moved the session back to the device's own account, re-signing into the same account asked " +
            "whether you wanted to switch, and a reinstall could permanently stop cloud saving.",
        ],
        diagram: "login",
      },
      {
        heading: "Decisions and trade-offs",
        decisions: [
          {
            choice: "Switch identity properly, through the backend's own login entry point",
            instead: "keeping the copy-based workaround and hardening it",
            because:
              "The copy approach could not be made correct. It destroyed story progress by design and " +
              "left two accounts sharing one identity. Before adding to a workaround, it is worth asking " +
              "whether the constraint it works around is still real.",
          },
          {
            choice: "Record the switch on disk before starting it",
            instead: "performing the switch and trusting it to complete",
            because:
              "A switch that dies halfway leaves a player in a half-built account, which is worse than " +
              "either endpoint. Writing the intent first makes the operation resumable.",
          },
          {
            choice: "An in-place restart behind the loading screen",
            instead: "asking the player to close and reopen the app",
            because:
              "iOS does not allow a self-relaunch, and \"please restart the app\" is where players leave. " +
              "Re-running the startup sequence gets the same clean state and looks like an ordinary load.",
          },
          {
            choice: "Rebuild the real avatar on the comparison screen",
            instead: "a generic placeholder next to the account name",
            because:
              "The player is being asked which account is theirs. A name and a number are weak evidence; " +
              "the character they dressed is immediate.",
          },
          {
            choice: "Sign-out leaves the email attached",
            instead: "unlinking on sign-out, as before",
            because:
              "Unlinking detached the account from its owner, almost certainly the source of years of " +
              "\"the game keeps giving me a new account\" reports. Signing out should end a session, not " +
              "dissolve an identity.",
          },
        ],
      },
      {
        heading: "Result",
        body: [
          "A device can hold several accounts, each with its own progress, and progress belongs to the " +
            "account rather than to the device.",
          "The more useful outcome was the six defects above. Most had nothing to do with account " +
            "switching and had been producing support tickets for a long time without anyone connecting " +
            "them to a cause.",
        ],
      },
    ],
  },

  {
    slug: "multi-catalog-addressables",
    number: "03",
    title: "Splitting 7,000 addressable entries into catalogs that load when they are needed",
    game: "Love Eden",
    studio: "United Tech",
    year: "2025",
    context: "Love Eden · United Tech",
    hook:
      "A boot catalog of 137 entries instead of 7,140, with story, photo and auxiliary content loaded " +
      "additively on the trigger that actually needs it.",
    constraint: "Cold start on low-end Android, remote content over Unity CCD, no store release per update",
    outcome: "Startup parses ~200KB of catalog instead of the entire content graph",
    tags: ["Addressables", "Unity CCD", "Cold Start", "Memory"],
    stack: ["Unity Addressables", "Unity Cloud Content Delivery", "UniTask", "C#"],

    sections: [
      {
        heading: "The problem",
        body: [
          "Love Eden is fully addressable. Every story script, character, background, avatar, photo and " +
            "UI asset is delivered remotely through Unity Cloud Content Delivery so new content ships " +
            "without a store release.",
          "The cost of that is a catalog. Addressables parses it during initialization, before the game " +
            "can do anything, and the whole catalog is parsed whether or not the player will ever open " +
            "the screen that needs it. With more than seven thousand entries, a narrative game with a " +
            "large photo library pays that bill on every cold start, on every device, including the cheap " +
            "Android phones that are a meaningful share of the install base.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "Four catalog domains, each a separate catalog file loaded independently and additively.",
          "Boot holds what the game cannot start without: UI, fonts, databases and core narrative " +
            "infrastructure. Around 137 entries, roughly 200KB, and the only catalog loaded during " +
            "initialization. Narrative content, about 2,521 entries, loads the first time a player opens " +
            "a chat or a date. Photos, the largest at about 4,170 entries, loads on an album, profile or " +
            "gallery. Auxiliary content, about 312 entries for customization, offers, voice messages and " +
            "AI chat settings, loads quietly in the background after login.",
          "A loader owns the additive load and deduplicates in-flight requests so two screens asking for " +
            "the same domain do not fetch it twice. Domains are a typed enum rather than string keys, and " +
            "warming one is triggered by a command, so the decision about when lives in the flow that " +
            "knows rather than inside the loader. Underneath, a shared-dependency group holds assets " +
            "referenced from more than one place so the same texture is not duplicated into several " +
            "bundles.",
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
              "finer means a chat open has to load six catalogs and wait for all of them, trading a " +
              "startup cost for a worse in-session one.",
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
              "entries while the player is already waiting is cheaper than a visible hitch when they tap " +
              "a customization button.",
          },
          {
            choice: "A typed enum for domains",
            instead: "string catalog identifiers",
            because:
              "Content keys get typo'd once and then fail only on a remote build, in one environment, " +
              "three days after release. The compiler should be able to answer that question.",
          },
        ],
      },
      {
        heading: "Result",
        body: [
          "Startup parses a 137-entry catalog rather than the full 7,140-entry content graph, and the " +
            "rest arrives on the trigger that needs it. Download size and memory pressure dropped further " +
            "once shared dependencies stopped being duplicated across bundles, and content updates " +
            "continue to ship without a client release.",
        ],
      },
    ],
  },

  {
    slug: "liveops-event-framework",
    number: "04",
    title: "A LiveOps pipeline where a new season is an art pass and a config pass",
    game: "Love Eden",
    studio: "United Tech",
    year: "2025",
    context: "Love Eden · United Tech",
    hook:
      "Special sales, endless offers, a season pass and five themed calendars on one event core. A new " +
      "theme ships without a code change.",
    constraint: "Seasonal content on a weekly cadence, no store review in the loop",
    outcome: "Themed campaigns ship as prefab variants and configuration, not as builds",
    tags: ["LiveOps", "Remote Config", "Battle Pass", "Content Pipeline"],
    stack: ["C#", "StrangeIoC", "PlayFab", "CBS", "Addressables"],

    sections: [
      {
        heading: "The problem",
        body: [
          "A live game's calendar does not wait for app review. Halloween happens on a date, and a " +
            "campaign that needs a client build can be lost to a rejected submission.",
          "The first seasonal events were built as features, each with its own screens, progression " +
            "tracking and reward logic, each a new release. Shipping the second one made it clear we " +
            "were going to write the same event five times a year forever.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "An event core the themed packages sit on. It owns what never changes between a Halloween " +
            "candy hunt and a Valentine's campaign: the event database, activity windows, per-player " +
            "progress, active-transaction tracking, and the rules for which event may interrupt the " +
            "player next.",
          "Six offer systems run on it: themed popups selling gem packages, a ladder of offers where " +
            "buying one unlocks the next, a season pass with free and premium tracks, a themed reward " +
            "calendar, welcome gifts and segment-targeted shop packs.",
          "The backend decides when an offer is live. The game asks which events are active, looks each " +
            "one up by its event ID, and gets back that event's themed prefabs for popup, banner and " +
            "icon. A season is therefore a folder of sprites and prefab variants; no logic is per-theme.",
          "Event progress is a save domain like any other, so it inherits cloud sync, debouncing and the " +
            "integrity guard from the save architecture rather than reimplementing them. Presentation " +
            "goes through the game-wide popup queue: events never open their own windows.",
        ],
        diagram: "liveops",
      },
      {
        heading: "Decisions and trade-offs",
        decisions: [
          {
            choice: "Per-theme prefab variants over a themed data format",
            instead: "describing each season's look in configuration",
            because:
              "Seasonal art is not parameterisable. Every attempt to express a Christmas popup as values " +
              "in a config file ends with an artist asking for one more field. Prefab variants let art " +
              "own the look and engineering own the behaviour, and the two stop negotiating.",
          },
          {
            choice: "Two event shapes, not a general-purpose event engine",
            instead: "a fully data-driven system that can express any campaign",
            because:
              "A general engine would have been a scripting language nobody wanted to learn, and every " +
              "real campaign for two years fit one of two shapes. Narrow abstractions that cover the " +
              "actual cases beat broad ones that cover the imagined ones.",
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
              "Event progress is player progress. Its own persistence path would have put campaign " +
              "rewards outside the integrity guard, which is exactly the data you cannot afford to lose " +
              "during a paid campaign.",
          },
        ],
      },
      {
        heading: "Result",
        body: [
          "Seasonal campaigns became a content job. A new themed event ships with sprites, prefab " +
            "variants and backend configuration on the existing release, and the client code running it " +
            "is the code that ran the last five. The same core carries the season pass and recurring " +
            "commercial events, so monetization surfaces and seasonal content share one progression and " +
            "reward model instead of two.",
          "The one trap worth naming: the link between dashboard and game is an event ID copied across " +
            "by hand, and a mismatch means the event is silently never shown. That is the first line of " +
            "the handover document I wrote for the system, not a footnote.",
        ],
      },
    ],
  },

  {
    slug: "attention-surfaces",
    number: "05",
    title: "Deciding what gets the player's attention, and in what order",
    game: "Love Eden",
    studio: "United Tech",
    year: "2025",
    context: "Love Eden · United Tech",
    hook:
      "Popups, shop banners and sidebar icons on one pattern: a prefab registry, a service that decides " +
      "eligibility and order, and ordering that lives in data rather than in code.",
    constraint: "A dozen systems competing for three surfaces, most of them at session start",
    outcome: "Adding a surface is prefab plus configuration work; a suppressed popup costs nothing",
    tags: ["UI Architecture", "Popup Queue", "A/B Testing", "Session Flow"],
    stack: ["C#", "StrangeIoC", "Addressables", "PlayFab Experiments", "DOTween"],

    sections: [
      {
        heading: "The problem",
        body: [
          "Every feature that wants the player's attention competes for one of three surfaces: a popup " +
            "over everything, a tile in the shop carousel, or an icon on the swipe screen. Offers, the " +
            "season pass, login bonus, subscription, unlock celebrations and warnings all want the first " +
            "one, and most of them want it at session start.",
          "Popups used to be permanent objects sitting in the scene, switched on and off. They could not " +
            "be handed data when opened, they could not be filtered, and adding one meant hand-placing " +
            "it in the scene.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "Popups are created when needed, destroyed when closed, given their data at creation, and " +
            "passed through a filter chain before they are ever built. Adding one means registering a " +
            "type, adding a prefab to the central library and dispatching a signal. No scene surgery.",
          "Which popups a player sees at launch, and in what order, comes from a strategy chosen by how " +
            "long they have had the game and how many sessions they have played. A first-session player " +
            "gets the login bonus and nothing else; from day one onward the sequence runs season pass, " +
            "login bonus, subscription benefit, then one offer picked at random from the eligible pool so " +
            "launches do not all look identical. Three guards stop the sequence outright.",
          "The filter chain holds an A/B filter that can suppress a popup for a variant or only when " +
            "triggered from a particular place in the game, and a security filter for flagged accounts. " +
            "Banners and sidebar icons follow the same pattern, with ordering as an inspector list so a " +
            "seasonal banner moves above or below the permanent ones without touching code.",
        ],
        diagram: "popup",
      },
      {
        heading: "Decisions and trade-offs",
        decisions: [
          {
            choice: "Filter before the popup is constructed",
            instead: "building it and hiding it when a filter rejects it",
            because:
              "A popup is a prefab, a data fetch and often an addressable load. Constructing one so it " +
              "can be thrown away means paying for content nobody will see, on the exact frame where the " +
              "player is already waiting for the session to start.",
          },
          {
            choice: "Session-start order chosen by player age and session count",
            instead: "one fixed priority list for everyone",
            because:
              "A first-ever session and a three-week-old account need different first screens. A fixed " +
              "list means either overwhelming the new player or wasting the returning one's attention.",
          },
          {
            choice: "One offer per session, picked from the eligible pool",
            instead: "showing every eligible offer, or always the highest priority one",
            because:
              "Showing all of them turns launch into a gauntlet. Always showing the top one means the " +
              "player sees the same popup every day until it expires and stops reading it.",
          },
          {
            choice: "Ordering as inspector data",
            instead: "an ordered enum or a hardcoded sequence",
            because:
              "Ordering is a live-ops decision made weekly by people who do not build the client. If " +
              "changing it needs an engineer and a release, it stops being changed.",
          },
        ],
      },
      {
        heading: "Result",
        body: [
          "All three surfaces run on the same shape: a registry, an eligibility service, configuration " +
            "outside the code. A new seasonal banner or offer icon is prefab and configuration work, and " +
            "the popup system was adopted project-wide and documented for the team rather than staying a " +
            "LiveOps-only tool.",
        ],
      },
    ],
  },

  {
    slug: "llm-companion-chat",
    number: "06",
    title: "Putting a language model inside the gameplay loop",
    game: "Love Eden",
    studio: "United Tech",
    year: "2026",
    context: "Love Eden · United Tech",
    hook:
      "Per-character personality, conversation memory, streamed replies with cancellation, a paywall on " +
      "the meter and a moderation path, shipped to players rather than demoed.",
    constraint: "Real users, real latency, real moderation risk, per-token cost",
    outcome: "Generative AI running in a production game with a live audience",
    tags: ["LLM Integration", "Streaming", "Moderation", "UniTask"],
    stack: ["C#", "UniTask", "OpenRouter", "StrangeIoC", "PlayFab"],

    sections: [
      {
        heading: "The problem",
        body: [
          "Love Eden's story content is authored. An AI companion chat is the opposite: unbounded, " +
            "unscripted, generated at request time. Putting one inside a shipped romance game raises " +
            "four problems at once, and none of them is the model call. The character has to stay in " +
            "character. The conversation has to remember what was said. The feature has to cost less " +
            "than it earns. And a system generating text to real users needs a path for when that text " +
            "is wrong.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "Character personality is configuration, not code. Each character carries its own prompt and " +
            "behaviour settings, authored alongside the rest of its content, so writers tune voice " +
            "without an engineer in the loop.",
          "A memory service assembles the context for each request within a budget, because context is " +
            "the thing you pay for. Requests go through a gateway rather than direct to one vendor, with " +
            "a pricing service alongside it, so model choice stays an operational decision and cost is " +
            "visible per model rather than discovered in a monthly invoice.",
          "Responses stream. A model answering in one block after several seconds reads as a frozen " +
            "game, so replies arrive token by token and every request is cancellable: if the player " +
            "leaves mid-answer the request is torn down rather than left to complete into a view that no " +
            "longer exists. Access is gated on subscription state, and an in-chat reporting flow lets a " +
            "player flag a response.",
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
              "Model pricing and quality move faster than app releases. A gateway makes switching a " +
              "configuration change and makes per-model cost visible while the feature is live.",
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
            "and instrumented for cost, engagement and reports. The part worth keeping is not the model " +
            "call: it is that character voice is content, cost is measured per model, cancellation is " +
            "handled properly, and there is a route for the answers that come out wrong.",
        ],
      },
    ],
  },
];

export const getSystem = (slug) => systems.find((s) => s.slug === slug);

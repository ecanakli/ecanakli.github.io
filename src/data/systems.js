// Deep-dive case studies. Each one is a page at /systems/<slug>.
//
// Everything here describes architecture and decisions, never source code.
// Numbers come from the shipped project and its handover documentation.

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
      "Replacing persistence under a title with real players: eleven services on one base class, " +
      "seventeen cloud keys collapsed into one, and a reinstall bug that was silently costing " +
      "players their progress.",
    constraint: "Live players, no acceptable data loss, a hard 10-key PlayFab write limit",
    outcome: "85%+ fewer cloud API calls, save latency down from 500–2000ms to 100–300ms",
    tags: ["Save Architecture", "PlayFab", "Cloud Sync", "Production Debugging"],
    stack: ["C#", "StrangeIoC", "PlayFab", "Newtonsoft.Json", "UniTask"],

    sections: [
      {
        heading: "The problem",
        body: [
          "Love Eden shipped with persistence written feature by feature. Every system had grown its " +
            "own save file, its own JSON settings and its own idea of when to write to the cloud. A " +
            "background command uploaded everything every ten seconds, for every player, whether or not " +
            "anything had changed and whether or not that player had an account worth syncing.",
          "Keys had multiplied along the way. Collectable photos and voice messages each had one cloud " +
            "key per character. The player profile alone was spread across seventeen separate keys, and " +
            "each key was its own API call. Social story progress was serialized through interfaces, so " +
            "every payload carried type metadata and could reach ninety kilobytes.",
          "The two stores were serialized through different settings, so a property skipped when null " +
            "on one path was written as an explicit null on the other. A property with a `new()` " +
            "initializer would come back from the cloud as null and overwrite a perfectly good default. " +
            "Nothing crashed. The player just found an emptier game than the one they left.",
          "And there was no write ordering at all. Last write won, which meant a device holding a stale " +
            "copy could overwrite newer progress from another device without anything noticing.",
        ],
      },
      {
        heading: "What made it hard",
        body: [
          "The game was already live. No migration window, no maintenance mode, and no version of this " +
            "work where existing players could be asked to start over. Every change landed on a weekly " +
            "release that shipped to players who were mid-story.",
          "PlayFab also has a hard ceiling that nothing in the documentation path made obvious: a single " +
            "write request may carry at most ten keys, counting data and deletions together. Reads have " +
            "no such limit, so everything read back perfectly while writes were failing wholesale.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "One generic base class that every save domain derives from. It owns loading, migration, local " +
            "persistence, cloud sync, debouncing and disposal, so a feature team adding a save domain " +
            "declares a data type, a file name and a cloud key and inherits correct behaviour for " +
            "everything else. Eleven services run on it; nine of those sync to the cloud.",
          "Local and cloud writes go through one shared serializer configuration. The two stores cannot " +
            "drift apart by construction rather than by discipline.",
          "Keys were consolidated hard. The player profile's seventeen keys became one. Per-character " +
            "photo and voice keys became one unified key each, with an in-memory cache giving O(1) " +
            "state checks instead of string manipulation on every read. Social story progress moved to a " +
            "compact dictionary at roughly 250 bytes per character.",
          "Cloud sync now activates on provider login rather than on a timer, and only for players who " +
            "have actually linked a Google or Apple account. Guests stay local-only and cost nothing.",
          "On top sits an integrity guard. Before any upload, a service is asked whether writing its " +
            "current state could destroy real data; if it has ever held real content and now looks " +
            "identical to a fresh instance, the upload is refused and the reason logged. Cloud fetches " +
            "report a typed outcome rather than a boolean, so the login flow can tell \"the cloud is " +
            "genuinely empty\" from \"the fetch failed\" from \"I skipped this to protect local data\".",
          "Two services are deliberately local-only. Naninovel saves are large, and a missing one " +
            "intentionally restarts that character's chat, which doubles as the black-screen mitigation; " +
            "real progression lives in the profile, which is synced. Mailbox read state is cheap to " +
            "rebuild and not worth one of ten cloud keys.",
        ],
        diagram: "save",
      },
      {
        heading: "The numbers",
        table: {
          head: ["", "Before", "After"],
          rows: [
            ["Save frequency", "Every 10 seconds, all players", "Provider login, once per session"],
            ["Player profile keys", "17 separate keys", "1 consolidated key"],
            ["API calls per save", "17+ separate calls", "1–8 batched calls"],
            ["Cloud activation", "Every player", "Provider-authenticated only"],
            ["Save latency", "500–2000 ms", "100–300 ms"],
            ["Social story payload", "Up to 90 KB with type metadata", "~250 bytes per character"],
          ],
        },
      },
      {
        heading: "The write limit that broke everything",
        body: [
          "Versioning each service meant giving each one an envelope: a write counter, the identity of " +
            "the install that produced the copy, and a timestamp. Nine synced services plus nine " +
            "per-service envelope keys came to eighteen keys per write request.",
          "PlayFab's limit is ten. Every write was rejected and cloud save was completely broken, but " +
            "because reads are unlimited, everything still loaded correctly and nothing looked wrong.",
          "The fix was to collapse the envelope into a single account-level key: nine services plus one " +
            "envelope equals ten, exactly at the ceiling. That budget is now full. A tenth synced " +
            "service requires consolidating something first, which is part of why mailbox and narrative " +
            "saves stayed local.",
        ],
      },
      {
        heading: "The reinstall bug",
        body: [
          "A player reported that a whole session had vanished: signed in, played, matched a character, " +
            "made progress, closed the game, reopened it, and everything from that session was gone. It " +
            "was reported as an account-switching problem. It was not. It affected every player who had " +
            "ever deleted and reinstalled the app.",
          "Writer identity is generated per install and stored locally. Deleting the app wipes it, so a " +
            "reinstall generates a new one while the cloud envelope still carries the old install's " +
            "identity. Counters matched, identities differed, and the conflict rule concluded that two " +
            "devices were writing at once. It refused the upload. Forever. Local saving was never " +
            "affected, so the game looked completely normal while nothing reached the cloud.",
          "What found it was a table read off a real player's device.",
        ],
        table: {
          head: ["Service", "Local writes", "Confirmed uploads", "Last upload"],
          rows: [
            ["PlayerProfile", "2,270", "88", "5 days ago"],
            ["SocialStory", "104", "43", "5 days ago"],
            ["Achievement", "69", "2", "5 days ago"],
            ["CollectablePhoto", "44", "3", "5 days ago"],
            ["DailyQuest", "32", "4", "5 days ago"],
            ["VoiceMessage", "18", "3", "5 days ago"],
            ["Badge", "64", "61", "today"],
          ],
          note:
            "Badge was the only service still uploading, and the only one whose recorded writer " +
            "identity matched the current install. That single row identified the root cause.",
        },
        body2: [
          "The fix records who wrote the cloud copy alongside each upload rather than comparing against " +
            "the device's current identity, and where that information is missing, which is the case for " +
            "every already-affected install, the concurrent-write check is skipped entirely. Locked " +
            "devices therefore recover by themselves on the fixed build. No migration, no support action.",
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
              "An earlier version of the fix did exactly that, and it was rejected in review and " +
              "removed. In a genuine conflict, forcing the write destroys the other device's data with " +
              "no evidence that ours is the better copy. Refusing preserves the cloud, the next fetch " +
              "updates the device, and no lock forms.",
          },
          {
            choice: "Do not pull the cloud copy when local data already exists",
            instead: "restoring from cloud whenever cloud data is present",
            because:
              "The only thing that writes progress to the cloud is the login-time batch upload, so the " +
              "local copy can never be older than the cloud copy. Fetching would overwrite newer local " +
              "progress with an older cloud one. The restore rule follows from that invariant rather " +
              "than from intuition.",
          },
          {
            choice: "Inspect the blob's content, not whether the key exists",
            instead: "treating a present save key as proof of real data",
            because:
              "Several services persist a default blob even on a clean install, so presence proves " +
              "nothing. The check also has to read the blob on disk, because it runs before the profile " +
              "has initialized in memory.",
          },
          {
            choice: "A partial fetch counts as failure",
            instead: "treating any restored service as success",
            because:
              "Success is what triggers clearing local story saves. Under the old rule, one service out " +
              "of eight restoring was enough to wipe story progress. A fetch now succeeds only with zero " +
              "hard failures and at least one restore.",
          },
          {
            choice: "Cloud sync only for provider-authenticated players",
            instead: "syncing every player automatically",
            because:
              "Guests are the majority and the least likely to pay. Syncing them bought nothing and " +
              "cost API budget on every ten-second tick.",
          },
          {
            choice: "Type names excluded from the serialized payload",
            instead: "Newtonsoft's type handling for polymorphic data",
            because:
              "Type name handling breaks under IL2CPP on iOS once the linker has had its way. Saves " +
              "that work in the editor and fail on device are the worst possible bug to find late.",
          },
        ],
      },
      {
        heading: "Result",
        body: [
          "Eleven save services share one serialization contract across local and cloud storage, so the " +
            "two can no longer silently diverge. Save operations dropped from a ten-second timer on " +
            "every player to a batched upload per session for players who actually have an account, and " +
            "save latency fell from between half a second and two seconds to between one and three " +
            "tenths.",
          "Versioned writes mean a stale device cannot overwrite newer progress, and write counters plus " +
            "writer identities make a save incident diagnosable from the device alone. That is what " +
            "turned the reinstall report from a mystery into a table.",
          "Every existing player was migrated in place, on a normal weekly release, without a reset and " +
            "without a support queue full of lost progress.",
        ],
      },
      {
        heading: "What is still open",
        body: [
          "I would rather write this down than claim the system is finished.",
          "Progress uploads at login, so if a player's final session is never followed by another " +
            "launch, that session is not in the cloud. It is a deliberate trade against cloud cost, and " +
            "a design to narrow it exists: also upload on logout, on real-money purchase and at episode " +
            "end. Designed, not implemented.",
          "A cloud save replaces the whole payload rather than merging fields, so one account used on " +
            "two devices running different app versions can lose a field the older build does not know " +
            "about. The mitigation is a round-trip container that carries unknown fields through " +
            "untouched, and it only helps if it is already in the build doing the damaging write, which " +
            "is the older one. Adding it protects fields added after it ships, not the ones already live.",
          "When a concurrent write is detected the local copy is backed up, but nothing in the app reads " +
            "that backup. There is no in-game recovery path from it yet.",
          "The migration marker is discovered by reflection on each save type and cached once per closed " +
            "generic. It works, but it is a convention enforced by a string rather than the compiler. A " +
            "required interface member would have cost one line per save type and removed a category of " +
            "\"why did this type not migrate\" questions.",
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
      "The game could only ever hold one backend account per device, so signing in with a different " +
      "email did not switch accounts. It copied the other account's data over yours.",
    constraint: "A live account system, real progress at stake, and iOS will not let an app relaunch itself",
    outcome: "Multiple accounts per device, each keeping its own progress, plus six unrelated login bugs closed",
    tags: ["Authentication", "PlayFab", "Account Recovery", "Production Debugging"],
    stack: ["C#", "PlayFab", "Sign in with Apple", "Google Sign-In", "StrangeIoC"],

    sections: [
      {
        heading: "The problem",
        body: [
          "Signing in with a second email was supposed to switch accounts. What it actually did was copy " +
            "the other account's data into the account already on the device, delete the story progress " +
            "as part of the process, and unlink the email on sign-out so the account lost its owner.",
          "Support had been seeing the symptoms for a long time without a diagnosis: progress that " +
            "appeared to vanish, accounts that kept getting new IDs, and story progress being deleted as " +
            "the price of signing in.",
        ],
      },
      {
        heading: "Why the old system behaved that way",
        body: [
          "The backend keeps its own copy of who the current player is, separate from the login session, " +
            "and every backend call sends that copy along with the request. An earlier attempt at real " +
            "account switching logged into the new account directly and bypassed the backend's own login " +
            "entry point.",
          "The result was a mismatch: the login session was account B while the backend still believed it " +
            "was account A. Every backend feature broke at once. Gems could not be bought, the store was " +
            "empty, and inventory and profile calls disagreed with each other.",
          "That was not a mysterious bug. It was the predictable consequence of using the wrong door. The " +
            "correct entry point existed in the backend SDK the whole time and had simply never been " +
            "called. Faced with a switch that broke everything, the original team chose to stop " +
            "switching identities and copy the data instead, and the reasoning is written into the old " +
            "code. Given what was known then it was a reasonable call. What changed is that the " +
            "underlying constraint turned out to be solvable.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "Four rules hold the new design together. Identity is decided at launch rather than mid-session. " +
            "The backend is always entered through its own login door, so its copy of who is playing is " +
            "never wrong. Switching means save, mark the switch on disk, reset local state, sign into the " +
            "target: nothing is copied and nothing is transferred. And the disk record is what guarantees " +
            "correctness, not the restart, so if the restart ever failed the next real launch still lands " +
            "on the right account.",
          "Switching accounts requires the game to fully reinitialise, and iOS does not let an app " +
            "relaunch itself. So the game performs an in-place restart: it tears everything down and " +
            "re-runs its own startup sequence from scratch behind the normal loading screen. To the " +
            "player it looks like a load, not a crash and not a request to restart manually.",
          "When the email belongs to a different account, the player gets a comparison screen with both " +
            "accounts side by side, each shown with its name, avatar, gem balance and progress. The " +
            "avatar is the real one, rebuilt layer by layer from that account's saved look rather than a " +
            "stock thumbnail, because the whole point is to let someone recognise their own account.",
          "They then choose. Switch, and the app restarts into the other account. Or stay, and the email " +
            "is attached to the account they are already playing. That second option is irreversible, so " +
            "it only happens on an explicit choice; closing the dialog never does it.",
        ],
        diagram: "login",
      },
      {
        heading: "What was fixed along the way",
        body: [
          "Several of these affected players who never touch account switching at all.",
        ],
        table: {
          head: ["Issue", "Who it affected"],
          rows: [
            [
              "Signing in could write your data into someone else's account: the \"does this email have an account?\" check logged into the other account to find out, and the app carried on with that session",
              "Anyone signing in. The strongest candidate for the historical \"my chats and matches are gone but my club points are still here\" reports",
            ],
            ["Google asked for consent three times during a sign-in, reduced to two", "Everyone signing in with Google"],
            ["Signing out unlinked the email from the account", "Everyone signing out"],
            [
              "Every network retry, even mid-game, silently moved the session back to the device's own account",
              "Anyone who switched accounts; it made re-login look like a fresh switch every time",
            ],
            ["Signing out and back into the same account asked \"do you want to switch?\"", "Same root cause as above"],
            ["A reinstall could permanently stop the game saving to cloud", "Anyone who deleted and reinstalled the app"],
          ],
        },
      },
      {
        heading: "Decisions and trade-offs",
        decisions: [
          {
            choice: "Switch identity properly, through the backend's own login entry point",
            instead: "keeping the copy-based workaround and hardening it",
            because:
              "The copy approach could not be made correct. It destroyed story progress by design and " +
              "left two accounts sharing one identity. The constraint everyone had worked around turned " +
              "out to be a function that was never called.",
          },
          {
            choice: "Record the switch on disk before starting it",
            instead: "performing the switch and trusting it to complete",
            because:
              "An account switch that dies halfway leaves a player in a half-built account, which is " +
              "worse than either endpoint. Writing the intent first makes the operation resumable: if " +
              "the restart fails, the next launch finishes the job.",
          },
          {
            choice: "An in-place restart behind the loading screen",
            instead: "asking the player to close and reopen the app",
            because:
              "iOS does not allow a self-relaunch, and \"please restart the app\" is where players leave. " +
              "Tearing down and re-running the startup sequence gets the same clean state and looks like " +
              "an ordinary load.",
          },
          {
            choice: "Rebuild the real avatar on the comparison screen",
            instead: "a generic placeholder next to the account name",
            because:
              "The player is being asked to pick which account is theirs. A name and a number are weak " +
              "evidence; the character they dressed is immediate.",
          },
          {
            choice: "Sign-out leaves the email attached",
            instead: "unlinking on sign-out, as before",
            because:
              "Unlinking detached the account from its owner, which is almost certainly the source of " +
              "years of \"the game keeps giving me a new account\" reports. Signing out should end a " +
              "session, not dissolve an identity.",
          },
        ],
      },
      {
        heading: "Result",
        body: [
          "A device can now hold several accounts, each with its own progress, and switching between them " +
            "keeps what belongs to each. Progress belongs to the account rather than to the device.",
          "The more valuable outcome was the six bugs listed above, most of which had nothing to do with " +
            "account switching and had been producing support tickets for a long time without anyone " +
            "connecting them to a cause.",
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
    number: "04",
    title: "A LiveOps pipeline where a new season is an art pass and a config pass",
    game: "Love Eden",
    studio: "United Tech",
    year: "2025",
    context: "Love Eden · United Tech",
    hook:
      "Special sales, endless offers, a season pass and five themed calendars, all running on one " +
      "event core. A new theme ships without a code change.",
    constraint: "Seasonal content on a weekly cadence, no store review in the loop",
    outcome: "Themed campaigns ship as prefab variants and configuration, not as builds",
    tags: ["LiveOps", "Remote Config", "Battle Pass", "Content Pipeline"],
    stack: ["C#", "StrangeIoC", "PlayFab", "CBS", "Addressables"],

    sections: [
      {
        heading: "The problem",
        body: [
          "A live game's calendar does not wait for app review. Halloween happens on a date, and a " +
            "campaign that needs a client build to go live can be lost to a rejected submission.",
          "The first seasonal events were built as features. Each had its own screens, its own " +
            "progression tracking and its own reward logic, and each was a new release. Shipping the " +
            "second one made it clear we were going to write the same event five times a year forever.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "An event core the themed packages sit on top of. It owns what never changes between a " +
            "Halloween candy hunt and a Valentine's campaign: the event database, activity windows, " +
            "per-player progress, active-transaction tracking, and the rules for which event may " +
            "interrupt the player next.",
          "Six offer systems run on it. Special sales are themed popups selling gem packages. Endless " +
            "offers are a ladder where buying one unlocks the next. The season pass carries a free and a " +
            "premium reward track. The calendar is a themed reward grid, and there are welcome gifts and " +
            "segment-targeted shop packs alongside them.",
          "The backend decides when an offer is live; the game asks which events are active, looks each " +
            "one up by its event ID, and gets back that event's themed prefabs for popup, banner and " +
            "icon. A season is therefore a folder of sprites and prefab variants. No logic is per-theme.",
          "Event progress is a save domain like any other, so it inherits cloud sync, debouncing and the " +
            "integrity guard from the save architecture rather than reimplementing them.",
          "Presentation goes through the game-wide popup queue. Events never open their own windows; they " +
            "offer popup data to a scheduler that decides what the player sees and when.",
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
              "Event progress is player progress. Giving it its own persistence path would have put " +
              "campaign rewards outside the integrity guard, which is precisely the data you cannot " +
              "afford to lose during a paid campaign.",
          },
        ],
      },
      {
        heading: "The trap worth documenting",
        body: [
          "The link between the dashboard and the game is the event ID. The backend generates it when the " +
            "event is created and it has to be copied into the game's event entry by hand. If it does not " +
            "match, the event is simply never shown. Silently, with no error.",
          "That is the kind of detail that costs a team a campaign, so it is the first thing in the " +
            "handover document I wrote for the system rather than a footnote.",
        ],
      },
      {
        heading: "Result",
        body: [
          "Seasonal campaigns became a content job. A new themed event ships with sprites, prefab " +
            "variants and backend configuration on the existing release, and the client code running it " +
            "is the code that ran the last five.",
          "The same core carries the season pass and recurring commercial events, so monetization " +
            "surfaces and seasonal content share one progression and reward model instead of two.",
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
      "Popups, shop banners and sidebar icons rebuilt on one pattern: a prefab registry, a service " +
      "that decides eligibility and order, and ordering that lives in data rather than in code.",
    constraint: "A dozen systems competing for three surfaces, all at session start",
    outcome: "Adding a surface is prefab plus configuration work; a suppressed popup costs nothing",
    tags: ["UI Architecture", "Popup Queue", "A/B Testing", "Session Flow"],
    stack: ["C#", "StrangeIoC", "Addressables", "PlayFab Experiments", "DOTween"],

    sections: [
      {
        heading: "The problem",
        body: [
          "Every feature that wants the player's attention competes for one of three surfaces: a popup " +
            "over everything, a tile in the shop's banner carousel, or an icon on the swipe screen. " +
            "Offers, the season pass, login bonus, subscription, unlock celebrations and warnings all " +
            "want the first one, and most of them want it at session start.",
          "Popups used to be permanent objects sitting in the scene, switched on and off. They could not " +
            "be handed data when opened, they could not be filtered, and adding one meant hand-placing it " +
            "in the scene.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "Popups are now created when needed, destroyed when closed, given their data at creation, and " +
            "passed through a filter chain before they are ever built. Adding one means registering a " +
            "type, adding a prefab to the central library and dispatching a signal. No scene surgery.",
          "There are two ways to open one. Open now stacks on top of whatever is already open, for " +
            "anything the player triggered. Queue waits for the stack to empty, for the session-start " +
            "sequence. The session-start queue drains once per session, which is a sharp edge worth " +
            "stating: a feature that wants a popup mid-game has to open it directly.",
          "Which popups a player sees when they open the game, and in what order, is decided by a " +
            "strategy chosen from how long they have had the game and how many sessions they have " +
            "played. A first-session player gets the login bonus and nothing else. From day one onward " +
            "the sequence runs season pass, login bonus, subscription benefit, and then one offer picked " +
            "at random from the eligible pool, so launches do not all look identical. Three guards stop " +
            "the sequence outright: already shown this session, an auto-swipe pending, or a player with " +
            "no matches yet.",
          "The filter chain currently holds two filters. An A/B filter can suppress a popup for a " +
            "variant, or only when it is triggered from a particular place in the game, configured from " +
            "the backend. A security filter blocks popups for flagged accounts. Because filtering runs " +
            "before the popup is created, a suppressed popup costs nothing.",
          "Banners and sidebar icons follow the same pattern. Banner ordering is a list in the inspector, " +
            "so a seasonal banner moves above or below the permanent ones without touching code. Banners " +
            "are built first and placed afterwards, so a slow network banner cannot land in the wrong " +
            "position, and when an event ends its banner is removed by ID while the rest of the carousel " +
            "is untouched.",
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
              "A player on their first ever session and a player three weeks in need different first " +
              "screens. A fixed list means either overwhelming the new player or wasting the returning " +
              "one's attention on a tutorial-shaped moment.",
          },
          {
            choice: "One offer per session, picked from the eligible pool",
            instead: "showing every eligible offer, or always the highest priority one",
            because:
              "Showing all of them turns launch into a gauntlet. Always showing the top one means a " +
              "player sees the same popup every day until it expires, and stops reading it.",
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
          "All three attention surfaces run on the same shape: a registry, an eligibility service and " +
            "configuration outside the code. A new seasonal banner or offer icon is prefab and " +
            "configuration work, and the popup system was adopted project-wide and documented for the " +
            "team rather than staying a LiveOps-only tool.",
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
            "behaviour settings, authored alongside the rest of its content, so writers tune a " +
            "character's voice without an engineer in the loop.",
          "A memory service assembles the context for each request. A chat is not a stateless prompt: it " +
            "carries what the player and the character have already established, within a budget, " +
            "because context is the thing you pay for.",
          "Requests go through a gateway service rather than direct to one vendor, with a pricing service " +
            "alongside it. Model choice is an operational decision, and the cost of a conversation is " +
            "something the business needs to see per model rather than discover in a monthly invoice.",
          "Responses stream. A model answering in one block after several seconds reads as a frozen game, " +
            "so replies arrive token by token into a chat bubble, and every request is cancellable. If " +
            "the player leaves the screen mid-answer, the request is cancelled and torn down rather than " +
            "left to complete into a view that no longer exists.",
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

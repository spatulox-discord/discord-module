# @spatulox/discord-module

[![npm version](https://img.shields.io/npm/v/@spatulox/discord-module.svg)](https://www.npmjs.com/package/@spatulox/discord-module)
[![npm downloads](https://img.shields.io/npm/dm/@spatulox/discord-module.svg)](https://www.npmjs.com/package/@spatulox/discord-module)
[![license](https://img.shields.io/npm/l/@spatulox/discord-module.svg)](#license)
[![discord.js](https://img.shields.io/badge/discord.js-%5E14.26.0-5865F2.svg)](https://discord.js.org/)

A type-safe module system for [discord.js](https://discord.js.org/) that turns a bot into a set of
independent features you can enable or disable at runtime, from a Discord message, without a restart.

Instead of scattering `client.on(...)` calls across your codebase, each feature becomes a `Module` that
declares the events it listens to. The library binds them, groups them, gives each one a place in a
generated control panel, and optionally persists its state to disk.

| | Plain discord.js | With this library |
|---|---|---|
| `client.on` calls scattered around the codebase | ❌ | ✅ Declared per module |
| Toggle a feature live | ❌ Needs a restart | ✅ One click |
| Feature grouping / nesting | ❌ | ✅ `MultiModule` |
| Interaction routing (buttons, slash, modals…) | ❌ Manual `if/else` dispatch | ✅ Automatic name → handler binding |
| Per-module settings page | ❌ | ✅ `openSettings()` |
| Persistent module state | ❌ | ✅ `ModuleWithCache` |

---

## Table of contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [API reference](#api-reference)
  - [`Module`](#module)
  - [`MultiModule`](#multimodule)
  - [`ModuleWithCache<T>`](#modulewithcachet)
  - [`ModuleWithStaticCache`](#modulewithstaticcache)
  - [`ModuleWithCachedMessage`](#modulewithcachedmessage)
  - [`ModuleManager`](#modulemanager)
  - [`ModuleRegistry`](#moduleregistry)
  - [`InteractionsManager`](#interactionsmanager)
  - [`ModuleUI`](#moduleui)
- [Per-module settings pages](#per-module-settings-pages)
- [Gotchas](#gotchas)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

---

## Requirements

| | Version | Notes |
|---|---|---|
| Node.js | 18+ | |
| `discord.js` | `^14.26.0` | Hard floor: the UI uses Components V2 (`SectionBuilder`, `ContainerBuilder`, `MessageFlags.IsComponentsV2`) |
| `@spatulox/utils` | `^0.2.0` | Not optional, used for cache persistence, mutexes and logging |

Both are **peer dependencies**, so you install them yourself.

## Installation

```bash
npm install @spatulox/discord-module discord.js @spatulox/utils
```

## Quick start

**1. Write a module**

```ts
import { Events, Message, ChatInputCommandInteraction } from "discord.js";
import { Module, ModuleEventsMap } from "@spatulox/discord-module";

export class PongModule extends Module {
    public name: string = "Pong Module";
    public description: string = "Replies to !ping";

    public get events(): ModuleEventsMap {
        return {
            // One handler per event...
            [Events.MessageCreate]: this.handleMessage.bind(this),
            // ...or several
            [Events.MessageUpdate]: [this.onEdit.bind(this), this.logEdit.bind(this)],
        };
    }

    private async handleMessage(message: Message) {
        if (message.content === "!ping") {
            await message.reply("Pong !");
        }
    }

    private async onEdit(message: Message) { /* ... */ }
    private async logEdit(message: Message) { /* ... */ }

    // Interaction handlers are registered separately, see InteractionsManager
    static async pingCommand(interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong !");
    }
}
```

**2. Wire it up**

```ts
import { Client, Events, GatewayIntentBits } from "discord.js";
import { ModuleManager, InteractionsManager, ModuleUI, InteractionMatchType } from "@spatulox/discord-module";
import { PongModule } from "./PongModule";

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once(Events.ClientReady, () => {
    // 1. Managers first (both are singletons)
    const manager = ModuleManager.createOrGetInstance(client);
    const interactions = InteractionsManager.createOrGetInstance(client);

    // 2. Register your modules
    manager.register(new PongModule());

    // 3. Modules are DISABLED by default
    manager.enableAll();

    // 4. Optional: post the control panel in a channel
    new ModuleUI(client, "YOUR_CHANNEL_ID");

    // 5. Register your interactions
    interactions.registerSlash("ping", PongModule.pingCommand);
    interactions.registerButton("btn_", async (interaction) => {
        await interaction.reply("Clicked !");
    }, InteractionMatchType.START_WITH);
});

client.login(process.env.DISCORD_BOT_TOKEN);
```

> [!IMPORTANT]
> **Order matters.** `ModuleManager.createOrGetInstance()` must run *before* any `MultiModule` is
> constructed. A `MultiModule` constructor throws `Module Manager Instance is null` otherwise.
> And modules start **disabled**, so call `enableAll()` (or enable them from the UI) or nothing happens.

## How it works

`register()` binds every handler declared in `events` to the client **once**, wrapping each one in an
`if (module.enabled)` guard. Enabling or disabling a module just flips that boolean, and no listener is
ever added or removed at runtime. That is why toggling is instant, free, and safe to do from a
button while the bot is live.

The consequence worth knowing: the `events` getter is read **once**, at `register()` time. Building the
map dynamically afterwards has no effect.

---

## API reference

Everything below is exported from the package root:

```ts
import {
    Module, ModuleEventsMap, MultiModule,
    ModuleWithCache, ModuleWithStaticCache, ModuleWithCachedMessage,
    ModuleManager, ModuleRegistry, ModuleUI,
    InteractionsManager, InteractionType, InteractionMatchType,
} from "@spatulox/discord-module";
```

### `Module`

The base class. Abstract, takes **no constructor argument**.

**You must implement:**

```ts
public abstract name: string;                   // unique, used as the UI label and custom id
public abstract description: string;            // shown under the name in the UI
public abstract get events(): ModuleEventsMap;  // {} if the module listens to nothing
```

**Useful members:**

| Member | Description |
|---|---|
| `enabled: boolean` | Read-only state |
| `enable()` / `disable()` / `toggle()` | Change the state |
| `parent: string` | Name of the owning `MultiModule`, or `"root"` |
| `instance: Module \| undefined` | Resolves this module through the registry |
| `hasSettings: boolean` | `true` when `openSettings()` is overridden |
| `openSettings(interaction)` | Override it to get a settings page, see [below](#per-module-settings-pages) |
| `createModuleUI(): SectionBuilder` | Override to customise how the module renders in the UI |

**`ModuleEventsMap`** maps any discord.js event name to one handler or an array of handlers:

```ts
type ModuleEventsMap = Partial<Record<keyof ClientEvents, Handler | Handler[]>>;
```

### `MultiModule`

Groups several modules under one entry in the UI. Extends `Module`, so `name` and `description` are still
required, but `events` is already implemented, so you can omit it.

**You must implement:**

```ts
public abstract readonly subModules: Module[];
```

```ts
import { MultiModule, Module } from "@spatulox/discord-module";

export class MusicPack extends MultiModule {
    public name: string = "Music";
    public description: string = "🎵 Everything music-related";

    public readonly subModules: Module[] = [
        new PlayModule(),
        new VolumeModule(),
        new AnotherMultiModule(), // nesting is supported
    ];
}
```

Submodules are registered automatically, so pass only the `MultiModule` to `manager.register()`.

| Member | Description |
|---|---|
| `enableAll()` / `disableAll()` | Apply to every submodule, recursively |
| `isAnyEnabled(): boolean` | `true` if at least one submodule is on |
| `enable(interaction?)` / `disable(interaction?)` | Passing the interaction re-renders the UI in place |

### `ModuleWithCache<T>`

A `Module` with typed state persisted to disk, guarded by a shared mutex.

**You must implement**, on top of the `Module` members:

```ts
protected abstract cacheKey: string;   // the cache file name
protected abstract initData(): T;      // default value, used when no file exists yet
```

> [!WARNING]
> `loadCache()` is **not** called for you. Call it from your constructor, or the module runs on
> `initData()` defaults and never reads what is on disk.

```ts
import { ModuleWithCache, ModuleEventsMap } from "@spatulox/discord-module";

interface VolumeCache { volume: number }

export class VolumeModule extends ModuleWithCache<VolumeCache> {
    public name: string = "Volume";
    public description: string = "Controls the volume";
    protected cacheKey: string = "volume_module";

    protected initData(): VolumeCache {
        return { volume: 50 };
    }

    constructor() {
        super();
        this.loadCache(); // required
    }

    public get events(): ModuleEventsMap { return {} }

    public async setVolume(volume: number) {
        await this.syncCache({ ...this.cache, volume });
    }
}
```

| Member | Description |
|---|---|
| `cache: T` | Current in-memory data |
| `key: string` | The resolved cache key |
| `loadCache(): Promise<void>` | Read from disk, merged over `initData()` |
| `syncCache(data: T): Promise<void>` | Replace, write to disk, re-read |
| `writeCache()` / `readCache()` | Lower-level, mutex-guarded |

Stored data is merged **over** the defaults, so adding a new key to `initData()` in a later version gives
existing installs the default instead of `undefined`.

Static helpers are available for one-off use without an instance:

```ts
await ModuleWithCache.initCache("my_key", { count: 0 });
await ModuleWithCache.readCache("my_key");
await ModuleWithCache.writeCache("my_key", { count: 42 });
```

### `ModuleWithStaticCache`

Same idea, but the state lives on the class instead of an instance. Use it when other parts of your bot
must read or mutate the state without holding a module instance.

```ts
import { ModuleWithStaticCache, ModuleEventsMap } from "@spatulox/discord-module";

interface StatsCache { autoBanCount: number }

export class StatsModule extends ModuleWithStaticCache {
    public name: string = "Stats";
    public description: string = "Counts moderation actions";

    static override cacheKey: string = "misc_stats";
    static override cacheData: StatsCache = { autoBanCount: 0 };

    // The base class types cacheData as `object`, so getCache() is untyped.
    // Add a typed accessor once instead of casting at every call site.
    static get cache(): StatsCache { return StatsModule.cacheData }

    public get events(): ModuleEventsMap { return {} }

    static async incrementAutoBan() {
        StatsModule.cache.autoBanCount++;
        await StatsModule.writeCache();
    }
}

await StatsModule.loadCache(); // on startup
```

**Which one do I pick?** `ModuleWithCache<T>` when the state belongs to one module instance and is fully
typed through the generic. `ModuleWithStaticCache` when the state is global and touched from outside the
module, at the cost of a `cacheData` typed as `object` on the base, hence the `static get cache()`
accessor above.

### `ModuleWithCachedMessage`

A `ModuleWithCache` whose state is one persistent Discord message: it is sent the first time and edited on
every subsequent run, surviving restarts. Its cache type is fixed to `{ channel_id, message_id }`.

**You must implement:**

```ts
abstract getChannel(): Promise<GuildBasedChannel | null>;
abstract buildMessage(): string | MessageCreateOptions;  // first send
abstract editMessage(): string | MessageEditOptions;     // later edits
```

Call `loadCache()` in your constructor: it resolves the stored message and decides between sending and
editing. Call `triggerUpdateMessage()` whenever the content should refresh. If the message was deleted in
the meantime (Discord error `10008`), a new one is sent and the cache updated.

### `ModuleManager`

Singleton owning the module tree and the event binding.

```ts
static createOrGetInstance(client: Client): ModuleManager  // the factory
static getInstance(): ModuleManager | null
```

| Member | Description |
|---|---|
| `register(module)` | Registers a `Module` or `MultiModule` (recursively). Throws on a duplicate name |
| `enableAll()` / `disableAll()` | Applies to every registered module |
| `getModule(name): Module \| undefined` | Case-insensitive lookup |
| `getRoot(): Module[] \| undefined` | Top-level modules |
| `enabledCount: number` | How many modules are currently on |
| `modules` | The full `parent → Module[]` map |

### `ModuleRegistry`

Static accessors over the manager, usable from anywhere without passing the manager around.

```ts
const module = ModuleRegistry.getModule("Volume");
if (module?.enabled) { /* ... */ }

ModuleRegistry.getModules();
ModuleRegistry.getRoot();
```

> [!CAUTION]
> Never call `ModuleRegistry.setModuleManager()` yourself, `ModuleManager` does it on creation.

### `InteractionsManager`

Routes every `InteractionCreate` to a handler registered by name (slash command name or component custom
id). Note the plural in the class name.

```ts
static createOrGetInstance(client: Client): InteractionsManager
```

Eight typed helpers, all sharing the same signature:

```ts
registerSlash(name, func, matchType?)
registerButton(name, func, matchType?)
registerSelectMenu(name, func, matchType?)
registerModal(name, func, matchType?)
registerAutocomplete(name, func, matchType?)
registerUserContextMenus(name, func, matchType?)
registerMessageContextMenus(name, func, matchType?)
registerPrimaryEntryPoint(name, func, matchType?)
```

They are sugar over the generic form:

```ts
interactions.register(InteractionType.BUTTON, { name, func, matchType });
```

**`InteractionMatchType`** controls how `name` is matched. The default is `EXACT`:

| Value | Matches |
|---|---|
| `EXACT` | `"confirm_delete"` → exactly that custom id |
| `START_WITH` | `"confirm_"` → `confirm_123`, `confirm_delete`, … |
| `END_WITH` | `"_cancel"` → `modal_cancel`, `btn_cancel`, … *(fixed in 0.11.1)* |

```ts
interactions.registerButton("confirm_", async (interaction) => {
    await interaction.update({ content: "Confirmed!" });
}, InteractionMatchType.START_WITH);
```

Dispatch tries `EXACT` first, then `START_WITH`, then `END_WITH`.

> [!WARNING]
> An interaction whose id matches nothing **throws**. Register a `START_WITH` catch-all if your bot emits
> component ids that are not all declared here.

### `ModuleUI`

The generated control panel, and the only concrete, directly instantiable class in the library.

```ts
new ModuleUI(client, "CHANNEL_ID");
```

Construct it **once**, after registering your modules, and discard the reference: it sends or edits its
own message, registers its own buttons, and keeps its message id in the cache across restarts.

- Paginates automatically past 40 components.
- Returns to the root page after 2 minutes of inactivity.
- The target channel must be a **guild** text channel the bot can view and post in.

> [!CAUTION]
> Never pass `ModuleUI` to `manager.register()`. It is self-managing, and its `events` getter throws by
> design. It also cannot be disabled.

---

## Per-module settings pages

*Since 0.11.0.*

Any module can own a settings page by overriding `openSettings()`. Nothing to register: the override is
detected automatically, and the UI adapts:

- in the module list, the module gets a **Show Module** button instead of the enable/disable one;
- on its own page, a ⚙️ button appears next to the enable/disable one.

Your module fully owns the interaction and **must answer it**, with an ephemeral reply, a modal, or whatever
fits.

```ts
import { ButtonInteraction, MessageFlags } from "discord.js";
import { ModuleWithCache, ModuleEventsMap } from "@spatulox/discord-module";

interface VolumeCache { volume: number }

export class VolumeModule extends ModuleWithCache<VolumeCache> {
    public name: string = "Volume";
    public description: string = "Controls the volume";
    protected cacheKey: string = "volume_module";

    protected initData(): VolumeCache { return { volume: 50 } }

    constructor() {
        super();
        this.loadCache();
    }

    public get events(): ModuleEventsMap { return {} }

    // Overriding this is enough, the ⚙️ button shows up on its own
    override async openSettings(interaction: ButtonInteraction): Promise<void> {
        await interaction.reply({
            content: `Current volume : ${this.cache.volume}`,
            flags: MessageFlags.Ephemeral,
        });
    }
}
```

This works on a `MultiModule` too: its page then shows ⚙️ **and** the enable/disable button **and** the
submodule list.

---

## Gotchas

**Handlers are called unbound.** Everything you put in `events`, and every interaction handler, is invoked
without a receiver. If it touches `this`, bind it:

```ts
// ✅
[Events.MessageCreate]: this.handleMessage.bind(this)

// ❌ `this` is undefined inside handleMessage
[Events.MessageCreate]: this.handleMessage
```

Same for interaction handlers registered from a class instance:

```ts
const instance = new MyHandler();

// ✅ bind, or wrap in an arrow
interactions.registerButton("btn_a", instance.handle.bind(instance));
interactions.registerButton("btn_b", (i) => instance.handle(i));

// ❌ loses the instance
interactions.registerButton("btn_c", new MyHandler().handle);
```

**Reserved custom ids.** `ModuleUI` claims `dm_prev`, `dm_next`, `dm_go_back`, `dm_page`, and the prefixes
`toggle_`, `show_` and `settings_`. Do not use them for your own components.

**Module names must be unique and reasonably short.** They are turned into custom ids, which Discord caps
at 100 characters, so keep names under ~90.

**Cache files** are written to `.utilscache/` relative to `process.cwd()`, one JSON per key (the key is
sanitised, so `discord-modules.cache` becomes `discord-modules_cache.json`). Add it to your `.gitignore`
and make sure the directory is writable in production.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full history.

Recent highlights:

- **0.11.1**: `InteractionMatchType.END_WITH` now works
- **0.11.0**: per-module settings pages via `openSettings()`
- **0.10.0**: `initData()` for default cache values
- **0.9.x**: `ModuleWithCachedMessage`
- **0.8.0**: `ModuleWithCache` and `ModuleWithStaticCache`
- **0.5.1**: UI pagination and nested `MultiModule`
- **0.2.0**: `InteractionsManager`

## Contributing

Bug reports and feature requests are welcome on the
[issue tracker](https://github.com/spatulox-discord/discord-module/issues).
More detailed documentation lives in the
[wiki](https://github.com/spatulox-discord/discord-module/wiki), and there is a
[Discord server](https://discord.gg/bAAZebKKYS) if you have questions.

## License

[MIT](https://opensource.org/licenses/MIT) © Spatulox

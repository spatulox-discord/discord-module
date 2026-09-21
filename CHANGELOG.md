# Changelog
Date format : dd/mm/yyy


### 21/09/2026 - 0.11.0
- Change :
  - A `Module` can now declare its own settings page by overriding `openSettings(interaction)`. Such a module is displayed with a "Show Module" button instead of the enable/disable one, and its own page shows a ⚙️ button next to the enable/disable one. The module fully owns the interaction (ephemeral reply, modal, ...). Works on `MultiModule` too
  - `MultiModule.createModuleUI()` now reuses `Module.createShowModuleUI()` instead of duplicating it
- Fix :
  - Targeting a simple (non `MultiModule`) module in the UI no longer falls back to the root module list
  - The anti double-click guard of the "Show Module" button no longer leaves the interaction hanging ("This interaction failed")

### 02/09/2026 - 0.10.2
- Fix :
  - `initData()` is now called again in `loadCache()`, once the module is fully constructed. The `cacheData` property initializer runs inside the base constructor, so anything `initData()` read from the instance (like a channel id given to the constructor) was still undefined, and `JSON.stringify` dropped those keys when creating the cache file (issue #8)
  - The stored cache is now merged over the default data of `initData()` (both in `ModuleWithCache` and `ModuleWithStaticCache`), so a cache file missing a key keeps its default value instead of an undefined one
  - `ModuleWithCachedMessage` and `ModuleUI` no longer send an undefined channel id to the Discord API (`GET /channels/undefined`, "Invalid Form Body")

### 27/05/2026 - 0.10.0
- Change :
  - Introduce an abstract "initData()" into `ModuleWithCache` to create default data
  - Make `ModuleWithCachedMessage` more robust to errors (message deletion while the bot is running)

### 27/05/2026 - 0.9.0 / 0.9.1 / 0.9.2 / 0.9.3
- Change :
  - Add `ModuleWithCachedMessage` which basically is just a wrapper of `ModuleWithCache` bu for a message

### 26/05/2026 - 0.8.2
- Fix
  - Loading cache with the `ModuleWithStaticCache` is now the same as `ModuleWithCache`
  - ModuleUi is no longer be disable

### 26/05/2026 - 0.8.1
- Fix
  - Centralize cache write mutex to `writeCache` method

### 26/05/2026 - 0.8.0
- Change :
  - Add two base class with cache (1 static, 1 instance)
  - ModuleUI is now a real module with a instance cache

### 20/05/2026 - 0.7.0
- Change :
  - The UI now reset each 2 minutes
- Fix :
  - Sending the ModuleUI message for the first time were unable to be updated

### 28/04/2026 - 0.6.0
- Migrate the ModuleUI cache to @spatulox/utils CacheManager

### 28/04/2026 - 0.5.3
- Fix : Interaction type detection now use 'isAnySelectMenu' instead of 'isStringSelectMenu'. This ensures that all select menu components (string, user, role, channel, mentionable) are correctly categorized as 'SELECT_MENU' interaction types.

### 14/04/2026 - 0.5.2
- Fix : MultiModule should no longer be register two times

### 14/04/2026 - 0.5.1
- Major update to the UI when showing modules
  - Authorize MultiModule inside MultiModules
  - UI now have a pagination system
  - Visual improvements

### 14/04/2026 - 0.4.1
- Singleton class now have a getOrCreateInstance() instead of a createInstance()

### 13/04/2026 - 0.4.0
- Introduce a ModuleRegistry to get Module instance

### 13/04/2026 - 0.3.1
- Update README.md : Add explanation for InteractionManager when passing class method when registering interactions

### 13/04/2026 - 0.3.0
- InteractionManager : adds support for prefix and suffix identifier matching

### 08/04/2026 - 0.2.1
- Add usage example for InteractionManager

### 08/04/2026 - 0.2.0
- Introduce an InteractionManager to register interaction, same as module system

### 18/03/2026 - 0.1.0
- First official release
- Add a Module system

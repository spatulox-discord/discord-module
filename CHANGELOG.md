# Changelog
Date format : dd/mm/yyy

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

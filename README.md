# Discord Module System

An ultra-simple and fully type-safe TypeScript module system for Discord.js

## 🚀 What’s it for ?

Turn your Discord bot into independent modules that can be enabled or disabled at will.

✨ Fonctionalities

    🔗 Auto-binding : module.events → automatic client.on()

    🎯 Free name : handleMessage() or myPingHandler() → you choose !

    ⚡ Performance : Only declared event are bind

    🔄 Hot reload : Enable/Disable problematic modules without restarting the bot !

    ✅ Automatic Interactions Binding (name <-> function/method) : No more mess between interactions detection, dispatch and function/method call

    Discordjs : Always up to date and completely compatible

## 🎮 Usage (2 minutes)
1. Module example
```ts
    export class PongModule extends Module {
        public name: string = "Pong Module";
        public description: string = "Reply with pong";
        public get events(): ModuleEventsMap {
            return {
                [Events.MessageCreate]: this.handleMessage,
                [Events.MessageUpdate]: [this.handleMessageUpdate1, this.handleMessageUpdate2],
            }
        }
    
        async handleMessage(message: Message) {
            if(message.content == "!ping") {
                message.reply("Pong !")
            }
        }
    
        async handleMessageUpdate1(message: Message) {
            message.reply("Update 1 !")
        }
    
        async handleMessageUpdate2(message: Message) {
            message.reply("Update 2 !")
        }

        static async pong_interaction(interaction: ChatInputCommandInteraction){
            interaction.reply("pong !)
        }
    
    }
```
2. Bot
```ts
client.once(Events.ClientReady, () => {
    const manager = ModuleManager.createInstance(client); // ModuleManager is a singleton
    const interactionManager = InteractionManager.createInstance(client); // InteractionManager is a singleton
    manager.register(new PongModule(client)); // You can register a Module or a MultiModule (Menu for Module)
    manager.enableAll(); // By default, a Module is disable
    manager.sendUIToChannel("channelID") // Optionnal, only if you want to dynamically toggle modules

    // Register commands
    interactionManager.registerSlash("ping", PongModule.pong_interaction)
    
    // If you want to link a Method of a class
    // This will crash because you only pass the method of the class, not the full class instance, so "randomBoolean" is undefined
    interactionManager.registerButton("btn_randombool_accessor", new BtnModuleTest().testAccessor) // This test is here to try to acces a var in an instance of a class wich is undefined
    // With a method of a class (which require a this.method() of this.var, you need to do it this way :
    const classInstance = new BtnModuleTest() // Create the instance
    interactionManager.registerButton("btn_randombool_accessor", (interaction: ButtonInteraction) => { return classInstance.testAccessor(interaction) }) // Pass an unknow func which call the class method with the instance
    interactionManager.registerButton("btn_randombool_accessor", () => { return classInstance.testAccessorWithoutInteraction() })
});
```

3. Module with a settings page

A module can declare its own settings page by overriding `openSettings()`.
When it does, the module list shows a **Show Module** button instead of the enable/disable one,
and the module page shows a ⚙️ button next to the enable/disable one.
The module fully owns the interaction : reply in ephemeral, open a modal, whatever you want.

```ts
    export class VolumeModule extends ModuleWithCache<{volume: number}> {
        public name: string = "Volume Module";
        public description: string = "Control the volume";
        protected cacheKey: string = "volume_module";
        protected initData() { return {volume: 50} }
        public get events(): ModuleEventsMap { return {} }

        // Overriding this is enough : the ⚙️ button shows up automatically
        override async openSettings(interaction: ButtonInteraction): Promise<void> {
            await interaction.reply({
                content: `Current volume : ${this.cache.volume}`,
                flags: MessageFlags.Ephemeral
            })
        }
    }
```

This works on a `MultiModule` too : its page then shows ⚙️ + enable/disable **and** the list of its submodules.

| Functionnalities    | Without Modules  | With Module   |
|---------------------|------------------|---------------|
| Hidden client.on    | ❌                | ✅             |
| Live module enabled | ❌ (Need restart) | ✅ (One click) |
| Organised           | ❌                | ✅             |
| Automatic interaction binding           | ❌                | ✅             |
| Per-module settings page           | ❌                | ✅             |
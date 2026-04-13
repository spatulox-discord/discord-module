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
});
```

| Functionnalities    | Without Modules  | With Module   |
|---------------------|------------------|---------------|
| Hidden client.on    | ❌                | ✅             |
| Live module enabled | ❌ (Need restart) | ✅ (One click) |
| Organised           | ❌                | ✅             |
| Automatic interaction binding           | ❌                | ✅             |
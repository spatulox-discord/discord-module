import {ButtonInteraction, Client, Events, GatewayIntentBits} from "discord.js";
import dotenv from "dotenv"
import {InteractionMatchType, ModuleManager} from "../index";
import {MusicMultiModule} from "./Music/MusicMultiModule";
import {PongModule} from "./PongModule";
import {InteractionsManager, InteractionType} from "../code/InteractionsManager";
import {BtnModuleTest} from "./BtnModuleTest";

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
});

client.once(Events.ClientReady, () => {
    const manager = ModuleManager.createInstance(client);
    const interactionManager = InteractionsManager.createInstance(client);
    manager.register(new MusicMultiModule())
    manager.register(new PongModule());
    manager.enableAll();
    manager.sendUIToChannel("1162047096220827831")

    interactionManager.registerSlash("ping", PongModule.ping_interaction)
    interactionManager.registerButton("btn_", BtnModuleTest.test, InteractionMatchType.START_WITH)
    interactionManager.register(InteractionType.SLASH, {name:"test", func: PongModule.ping_interaction, matchType: InteractionMatchType.EXACT}) // This is the same thing, registerSlash is just a wrapper to avoid mistakes


    // This will crash because you only pass the method of the class, not the full class instance, so "randomBoolean" is undefined
    // interactionManager.registerButton("btn_randombool_accessor0", new BtnModuleTest().testAccessor) // This test is here to try to acces a var in an instance of a class
    // With a method of a class (which require a this.method() of this.var, uou need to do it this way :
    const classInstance = new BtnModuleTest()
    interactionManager.registerButton("btn_randombool_accessor1", (interaction: ButtonInteraction) => { return classInstance.testAccessor(interaction) })
    interactionManager.registerButton("btn_randombool_accessor2", () => { return classInstance.testAccessorWithoutInteraction() })

    console.log("Bot ready!")
    new BtnModuleTest().sendMessageWithbutton(client, "1162047096220827831")
});
client.login(process.env.DISCORD_BOT_TOKEN);
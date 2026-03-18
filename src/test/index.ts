import {Client, Events, GatewayIntentBits} from "discord.js";
import dotenv from "dotenv"
dotenv.config();
import {ModuleManager} from "../index";
import {MusicMultiModule} from "./Music/MusicMultiModule";
import {PongModule} from "./PongModule";

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
    manager.register(new MusicMultiModule())
    manager.register(new PongModule());
    manager.enableAll();
    manager.sendUIToChannel("1162047096220827831")

    console.log("Bot ready!")
});
client.login(process.env.DISCORD_BOT_TOKEN);
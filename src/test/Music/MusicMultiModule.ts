import {ButtonInteraction, MessageFlags} from "discord.js";
import {MultiModule, Module} from "../../index";
import {PlayModule} from "./PlayModule";
import {VolumeModule} from "./VolumeModule";
import {RandomModule7} from "../random/RandomModule7";

export class MusicMultiModule extends MultiModule {
    name = "Music Multi Module";
    description = "🎵 Système de musique complet";

    public subModules: Module[] = [
        new PlayModule(),
        new VolumeModule(),
        new RandomModule7()
    ];

    // A MultiModule can declare settings too : ⚙️ shows up on its page, above its submodules
    override async openSettings(interaction: ButtonInteraction): Promise<void> {
        await interaction.reply({
            content: `⚙️ Settings of **${this.name}** (${this.subModules.length} submodules)`,
            flags: MessageFlags.Ephemeral
        })
    }
}
import {ButtonInteraction, MessageFlags} from "discord.js";
import {ModuleEventsMap} from "../code/Module";
import {ModuleWithCache} from "../code/modules/ModuleWithCache";

interface cache {
    greeting: string
}

/**
 * A Module which declares a settings page : it is displayed with a "Show Module" button
 * in the list, and its own page gets a ⚙️ button next to the enable/disable one.
 */
export class SettingsModuleTest extends ModuleWithCache<cache> {
    name: string = "Settings Module Test";
    description: string = "Module with its own settings page";

    cacheKey: string = "settings_module_test"

    protected initData(): cache {
        return {greeting: "Hello"}
    }

    get events(): ModuleEventsMap {
        return {}
    }

    constructor() {
        super();
        this.loadCache()
    }

    // The Module owns the interaction : here a simple ephemeral reply
    override async openSettings(interaction: ButtonInteraction): Promise<void> {
        await interaction.reply({
            content: `⚙️ Settings of **${this.name}**\nCurrent greeting : \`${this.cacheData.greeting}\``,
            flags: MessageFlags.Ephemeral
        })
    }
}

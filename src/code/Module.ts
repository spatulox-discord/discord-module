import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ClientEvents,
    SectionBuilder,
    TextDisplayBuilder
} from 'discord.js';
import {ModuleRegistry} from "./ModuleRegistry";

type ModuleEventHandler =
    | ((...args: any[]) => any)
    | ((...args: any[]) => any)[];

export type ModuleEventsMap = Partial<Record<keyof ClientEvents, ModuleEventHandler>>;

export abstract class Module     {
    private _parent: string | "root" = "root";
    public abstract name: string;
    public abstract description: string;
    private _enabled = false;

    public abstract get events(): ModuleEventsMap;

    public get instance() : Module | undefined {
        return ModuleRegistry.manager?.getModule(this.name);
    }

    public setParent(parent: string): void {
        this._parent = parent;
    };

    public get parent(): string | "root" {
        return this._parent
    }

    /**
     * True as soon as a subclass overrides openSettings() on its prototype.
     * A Module declaring settings is shown with a "Show Module" button instead of a toggle,
     * and its own page displays the ⚙️ button.
     */
    public get hasSettings(): boolean {
        return this.openSettings !== Module.prototype.openSettings;
    }

    /**
     * Override this to give your Module a settings page.
     * The Module owns the interaction : reply, showModal, ... whatever you want, but answer it.
     */
    public async openSettings(_interaction: ButtonInteraction): Promise<void> {
        throw new Error(`Module '${this.name}' does not implement openSettings()`);
    }

    private buildCustomId(prefix: string): string {
        const name = `${prefix}${this.name.toLowerCase()}`;

        if(name.length > 100){
            throw new Error(`In order to create the Module UI, buttons customId should not be more than 100 char, please reduce the name of your Module : ${this.name}`);
        }
        return name;
    }

    private createToggleButton(): ButtonBuilder {
        return new ButtonBuilder()
            .setLabel(this.enabled ? "Disabled" : "Enable")
            .setCustomId(this.buildCustomId("toggle_"))
            .setStyle(this.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
    }

    protected createModuleSection(): SectionBuilder {
        return new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${this.enabled ? "🟢" : "🔴"} ${this.name}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${this.description}`))
    }

    /**
     * Row of buttons displayed on the Module own page : ⚙️ (only when the Module has settings) + enable/disable
     */
    public createModuleDetailRow(): ActionRowBuilder<ButtonBuilder> {
        const action = new ActionRowBuilder<ButtonBuilder>()

        if(this.hasSettings){
            action.addComponents(new ButtonBuilder()
                .setLabel("⚙️")
                .setCustomId(this.buildCustomId("settings_"))
                .setStyle(ButtonStyle.Secondary)
            )
        }

        action.addComponents(this.createToggleButton())

        return action
    }

    protected createShowModuleUI(): SectionBuilder {
        return this.createModuleSection()
            .setButtonAccessory(new ButtonBuilder().setLabel("Show Module").setCustomId(this.buildCustomId("show_")).setStyle(ButtonStyle.Primary))
    }

    public createModuleUI(): SectionBuilder {
        // A Module with a settings page is not toggled from the list : you enter its page first
        if(this.hasSettings){
            return this.createShowModuleUI()
        }

        return this.createModuleSection()
            .setButtonAccessory(this.createToggleButton())
    }

    get enabled(): boolean {return this._enabled}
    toggle() {this._enabled = !this._enabled}
    enable() { this._enabled = true; }
    disable() { this._enabled = false; }
};

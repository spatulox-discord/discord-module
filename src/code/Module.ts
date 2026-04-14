import {
    ButtonBuilder,
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

    public createModuleUI(): SectionBuilder {
        const name = `toggle_${this.name.toLowerCase()}`;

        if(name.length > 100){
            throw new Error(`In order to create the Module UI, buttons customId should not be more than 100 char, please reduce the name of your Module : ${this.name}`);
        }
        return new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${this.enabled ? "🟢" : "🔴"} ${this.name}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${this.description}`))
            .setButtonAccessory(new ButtonBuilder().setLabel(this.enabled ? "Disabled" : "Enable").setCustomId(name).setStyle(this.enabled ? ButtonStyle.Danger : ButtonStyle.Success))
    }

    get enabled(): boolean {return this._enabled}
    toggle() {this._enabled = !this._enabled}
    enable() { this._enabled = true; }
    disable() { this._enabled = false; }
};
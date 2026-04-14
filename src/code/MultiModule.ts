import { ModuleManager } from './ModuleManager.js';
import {
    ButtonBuilder,
    ButtonInteraction, ButtonStyle,
    ContainerBuilder, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize,
    TextDisplayBuilder,
} from 'discord.js';
import {Module, ModuleEventsMap} from "./Module";

export abstract class MultiModule extends Module {
    private readonly manager;
    public abstract readonly subModules: Module[];

    constructor() {
        super()
        const inst = ModuleManager.getInstance()
        if(inst){
            this.manager = inst
        } else {
            throw new Error("Module Manager Instance is null")
        }
    }

    public get events(): ModuleEventsMap {
        return [] as ModuleEventsMap;
    }

    override createModuleUI(): SectionBuilder {
        const name = `show_${this.name.toLowerCase()}`;

        if(name.length > 100){
            throw new Error(`In order to create the Module UI, buttons customId should not be more than 100 char, please reduce the name of your Module : ${this.name}`);
        }
        return new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${this.enabled ? "🟢" : "🔴"} ${this.name}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${this.description}`))
            .setButtonAccessory(new ButtonBuilder().setLabel("Show Module").setCustomId(name).setStyle(ButtonStyle.Primary))
    }

    protected createSubmoduleUI(){
        const container = new ContainerBuilder();

        container.addSectionComponents(this.createModuleUI())

        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))

        for (const module of this.subModules) {
            container.addSectionComponents(module.createModuleUI())
        }

        return container;
    }

    override enable(interaction?: ButtonInteraction) {
        super.enable()
        this.notifyChange(interaction);
    }

    async enableAll(interaction?: ButtonInteraction) {
        this.subModules.forEach(module => {
            module.enable();
        })
        this.enable(interaction);
    }

    override disable(interaction?: ButtonInteraction) {
        super.disable()
        this.notifyChange(interaction);
    }

    async disableAll(interaction?: ButtonInteraction) {
        this.subModules.forEach(module => {
            module.disable();
        })
        this.disable(interaction);
    }

    public notifyChange(interaction?: ButtonInteraction) {
        if (!interaction) return;

        interaction.update({
            components: [this.createSubmoduleUI()]
        });
    }

    public isAnyEnabled(): boolean {
        return Object.values(this.manager.modules).flat().some(m => m.enabled);
    }

}
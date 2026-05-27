import {
    ActionRowBuilder,
    ButtonBuilder, ButtonInteraction,
    ButtonStyle,
    Client,
    ContainerBuilder,
    GuildBasedChannel,
    MessageCreateOptions,
    MessageEditOptions,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder
} from "discord.js";
import {Module, ModuleEventsMap} from "../Module";
import {MultiModule} from "./MultiModule";
import {ModuleRegistry} from "../ModuleRegistry";
import {InteractionMatchType, InteractionsManager} from "../InteractionsManager";
import {Time} from "@spatulox/utils";
import {ModuleWithCachedMessage} from "./ModuleWithCachedMessage";

type TrucBidule = MultiModule | Module | "root"
type DynamicPage = Record<number, SectionBuilder[]>

export class ModuleUI extends ModuleWithCachedMessage {

    async getChannel(): Promise<GuildBasedChannel | null> {
        const chan = await this.client.channels.fetch(this.cacheData.channel_id)
        if (chan && chan.isSendable() && !chan.isDMBased()){
                return chan
        }
        return null
    }

    buildMessage(): string | MessageCreateOptions {
        return {
            components: this.createUI(),
            flags: MessageFlags.IsComponentsV2
        }
    }
    editMessage(): string | MessageEditOptions {
        return {
            components: this.createUI(),
            flags: MessageFlags.IsComponentsV2
        }
    }


    public name: string = "ModuleUI";
    public description: string = "Module wich is used to display other modules..."
    public get events(): ModuleEventsMap {
        throw new Error("Method not implemented.");
    }

    private client: Client;

    protected cacheKey: string = "discord-modules.cache"

    private targetedModuleName: string | "root" = "root"
    private triggerDynamicPageRebuild: boolean = true;
    private readonly MAX_COMPONENT_PER_PAGE = 40
    private dynamicPage: DynamicPage = {}
    private pageIndex: number = 0
    private breadcrumbTrail: string[] = ["Home"]
    private breadcrumbTrailSet: Set<string> = new Set(this.breadcrumbTrail); // Avoid double thing, since sometime discord let user press the button two times...

    private uiResetTimeout: NodeJS.Timeout | null = null;
    private readonly UI_RESET_TIMEOUT_MS = Time.minute.MIN_02.toMilliseconds();

    constructor(client: Client, channel_id: string) {
        super()
        this.client = client;
        this.setup(channel_id)
    }

    override disable() {
        return
    }

    override toggle() {
        return
    }

    private async setup(channel_id: string): Promise<void> {
        await this.loadCache()
        if(this.cacheData.channel_id == null || this.cacheData.channel_id == ""){
            this.cacheData.channel_id = channel_id
            await this.writeCache()
        }
        await this.registerButtons()
    }

    private async registerButtons(): Promise<void> {
        const interactionManager = InteractionsManager.createOrGetInstance(this.client);
        interactionManager.registerButton("dm_prev", (interaction: ButtonInteraction) => { this.changePageIndex(interaction, this.pageIndex - 1) })
        interactionManager.registerButton("dm_next", (interaction: ButtonInteraction) => { this.changePageIndex(interaction, this.pageIndex + 1) })
        interactionManager.registerButton("dm_go_back", (interaction: ButtonInteraction) => { this.goBack(interaction) })
        interactionManager.registerButton("toggle_", (interaction: ButtonInteraction) => { this.toggleModule(interaction) }, InteractionMatchType.START_WITH)
        interactionManager.registerButton("show_", (interaction: ButtonInteraction) => { this.showSubModule(interaction) }, InteractionMatchType.START_WITH)
    }

    private async goBack(interaction: ButtonInteraction) {
        const mod = this.getTargetedModule()
        if(mod == "root"){
            return
        }
        this.triggerDynamicPageRebuild = true
        this.targetedModuleName = mod.parent
        this.breadcrumbTrail.pop()
        this.breadcrumbTrailSet = new Set(this.breadcrumbTrail)
        await this.updateUI()
        interaction.deferUpdate()
    }

    private getModuleNameFromButtonId(interaction: ButtonInteraction, prefix: string){
        const module_id_from_btn_id = interaction.customId.split(prefix)[1]
        if(!module_id_from_btn_id){return}
        if(!ModuleRegistry.getModule(module_id_from_btn_id)){
            interaction.reply({
                content: `This module does not exist : ${module_id_from_btn_id}`,
                flags: MessageFlags.Ephemeral
            })
            return
        }
        return module_id_from_btn_id
    }

    private async toggleModule(interaction: ButtonInteraction) {
        const module_id_from_btn_id = this.getModuleNameFromButtonId(interaction, "toggle_")
        if(!module_id_from_btn_id) return
        const mod = ModuleRegistry.getModule(module_id_from_btn_id)
        if(mod){
            mod.toggle()
            this.triggerDynamicPageRebuild = true
            await this.updateUI()
        }
        interaction.deferUpdate()
    }

    private async showSubModule(interaction: ButtonInteraction) {
        const module_id_from_btn_id = this.getModuleNameFromButtonId(interaction, "show_")
        if(!module_id_from_btn_id) return
        this.triggerDynamicPageRebuild = true
        this.targetedModuleName = module_id_from_btn_id

        const mod = ModuleRegistry.getModule(module_id_from_btn_id)

        const mod_str = mod != null ? mod.name : module_id_from_btn_id
        if(this.breadcrumbTrailSet.has(mod_str)){
            return
        }
        this.breadcrumbTrail.push(mod_str)
        this.breadcrumbTrailSet = new Set(this.breadcrumbTrail)
        this.pageIndex = 0
        await this.updateUI()
        interaction.deferUpdate()
    }

    private async changePageIndex(interaction: ButtonInteraction, newIndex: number) {
        this.pageIndex = newIndex;
        await this.updateUI()
        interaction.deferUpdate()
    }

    private getTargetedModule(): TrucBidule {
        const mod = ModuleRegistry.getModule(this.targetedModuleName)
        return mod ?? "root"
    }

    private async scheduleUIReset() {
        // Cancel timer
        if (this.uiResetTimeout) {
            clearTimeout(this.uiResetTimeout);
        }

        if(this.targetedModuleName == "root"){
            return
        }

        // Start another one
        this.uiResetTimeout = setTimeout(() => {
            this.resetUI().catch(console.error);
        }, this.UI_RESET_TIMEOUT_MS);
    }

    private async resetUI() {
        this.targetedModuleName = "root";
        this.triggerDynamicPageRebuild = true;
        this.pageIndex = 0;
        this.breadcrumbTrail = ["Home"];
        this.breadcrumbTrailSet = new Set(this.breadcrumbTrail);
        await this.updateUI();
    }

    private createUI(): (ContainerBuilder | ActionRowBuilder<ButtonBuilder>)[]{
        const multi = this.getTargetedModule()
        if (!multi) {
            throw new Error("Impossible to render the targeted Module : Module is not a MultiModule")
        }
        const container = new ContainerBuilder()
        this.createHeaderContainer(container)
        const footer = this.createFooterbuttonRow() // Here it's used to determine the number of component
        const maxComponents = this.MAX_COMPONENT_PER_PAGE - this.countComponents([container, footer])

        if(this.triggerDynamicPageRebuild) {
            this.triggerDynamicPageRebuild = false
            // Header and Footer need to be determined before creating the dynamic main UI
            this.dynamicPage = this.createDynamicUI(container, multi, maxComponents)
        }

        const newFooter = this.createFooterbuttonRow()

        const page = this.dynamicPage[this.pageIndex];
        if (!page) return [container, newFooter]

        for (const comp of page) {
            container.addSectionComponents(comp);
        }
        return [container, newFooter]
    }

    // 4 components
    private createHeaderContainer(container: ContainerBuilder) {
        container
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Module Manager`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`You can enable/disable any module`))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(this.breadcrumbTrail.join(" > ")))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    }

    //private createFooterContainer(container: ContainerBuilder){}
    // 32 component max
    private createDynamicUI(_container: ContainerBuilder, multiMod: TrucBidule, maxComponent: number): DynamicPage {
        if (multiMod instanceof MultiModule) {
            return this.buildDynamicPage(multiMod.subModules, maxComponent);
        }

        const root = ModuleRegistry.getRoot() ?? [];
        return this.buildDynamicPage(root, maxComponent);
    }

    // 4 component
    private createFooterbuttonRow(): ActionRowBuilder<ButtonBuilder> {
        const action = new ActionRowBuilder<ButtonBuilder>()

        const numberPage = Object.keys(this.dynamicPage).length

        action.addComponents(new ButtonBuilder()
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("dm_prev")
            .setDisabled(this.pageIndex <= 0)
        )

        action.addComponents(new ButtonBuilder()
            .setLabel(`Page ${this.pageIndex+1}/${numberPage}`)
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("dm_page")
            .setDisabled(true)
        )

        action.addComponents(new ButtonBuilder()
            .setLabel("Next")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("dm_next")
            .setDisabled(this.pageIndex+1 >= numberPage)
        )

        action.addComponents(new ButtonBuilder()
            .setLabel("Back")
            .setStyle(ButtonStyle.Danger)
            .setCustomId("dm_go_back")
            .setDisabled(this.targetedModuleName === "root")
        )

        return action
    }

    private countComponents(components: any[]): number {
        return components.reduce((sum, c) => {
            let n = 1;
            if (c.components && Array.isArray(c.components)) {
                n += this.countComponents(c.components);
            }
            if (c.accessory) {
                n += 1
            }
            return sum + n;
        }, 0);
    }

    private async updateUI() {
        if(!this.message){
            console.error("Cannot update the targeted message : Unknown Message")
            return
        }
        this.message?.edit({
            components: this.createUI()
        })
        this.scheduleUIReset();
    }


    private buildDynamicPage(
        modules: Module[],
        maxComponent: number
    ): DynamicPage {
        const dynamicPage: DynamicPage = {};
        let pageNumber = 0;
        let components: SectionBuilder[] = [];
        let count = 0;

        /**
         * For to avoid more than 40 component in a message, based on the number of component in header and footer
         */
        for (const module of modules) {
            const comp = module.createModuleUI();
            const compCount = this.countComponents([comp])
            if (count + compCount >= maxComponent) {
                dynamicPage[pageNumber] = components;
                pageNumber++;
                components = [];
                count = 0;
            }
            components.push(comp);
            count += compCount;
        }

        // reste éventuel
        if (components.length > 0) {
            dynamicPage[pageNumber] = components;
        }

        return dynamicPage;
    }

    /*private printAllComponents(components: any[], indent = ""): void {
        for (const c of components) {
            // Affiche le type et quelques infos simples
            let desc = `<unknown>`;

            if (c.type === 10) {
                desc = `TextDisplay("${c.content?.substring(0, 50) ?? ""}...")`;
            } else if (c.type === 14) {
                desc = `Separator(divider=${c.divider}, spacing=${c.spacing})`;
            } else if (c.type === 9) {
                desc = `Section`;
            } else if (c.type === 2) {
                desc = `Button("${c.label}" | id="${c.custom_id ?? c.customId}")`;
            } else {
                desc = `Type${c.type ?? "???"}`;
            }

            console.log(indent + desc);

            if (c.components && Array.isArray(c.components)) {
                this.printAllComponents(c.components, indent + "  ");
            }
            if (c.accessory) {
                let desc = `Accessory(${c.accessory.label})`;
                console.log(indent + "  " + desc);
            }
        }
    }*/
}
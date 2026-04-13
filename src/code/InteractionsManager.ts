import {Client, Events, Interaction} from "discord.js";

export enum InteractionType {
    AUTOCOMPLETE = "AUTOCOMPLETE",
    BUTTON = "BUTTON",
    MESSAGE_CONTEXT_MENU = "MESSAGE_CONTEXT_MENU",
    USER_CONTEXT_MENU = "USER_CONTEXT_MENU",
    MODAL = "MODAL",
    PRIMARY_ENTRY_POINT = "PRIMARY_ENTRY_POINT",
    SELECT_MENU = "SELECT_MENU",
    SLASH = "SLASH",

}
type InteractionHandler = (...args: any[]) => any;
type InteractionMap = Record<string, InteractionHandler>
type Interactions = Record<InteractionType, InteractionMap>

export enum InteractionMatchType {
    EXACT,
    START_WITH,
    END_WITH
}

type InteractionIdentifier = {type: InteractionType, identifier: string}

export class InteractionsManager {

    private startWithSet: Set<string> = new Set()
    private endWithSet: Set<string> = new Set()

    private interactionMap: Interactions = {
        [InteractionType.AUTOCOMPLETE]: {},
        [InteractionType.BUTTON]: {},
        [InteractionType.MESSAGE_CONTEXT_MENU]: {},
        [InteractionType.USER_CONTEXT_MENU]: {},
        [InteractionType.MODAL]: {},
        [InteractionType.PRIMARY_ENTRY_POINT]: {},
        [InteractionType.SELECT_MENU]: {},
        [InteractionType.SLASH]: {},
    };
    private client: Client | null;
    private static instance: InteractionsManager | null;

    private constructor(client: Client) {
        this.client = client;
        this.initClient(this.client);
    }

    public static createInstance(client: Client): InteractionsManager {
        InteractionsManager.instance = new InteractionsManager(client);
        return InteractionsManager.instance;
    }

    private initClient(client: Client) {
        client.on(Events.InteractionCreate, async (interaction: Interaction) => {

            const info = this.getInteractionInfo(interaction);
            if(!info) throw new Error("Interaction info not found");
            const { type } = info;

            const map = this.interactionMap[type];
            if (map) {
                await this.handle(map, info, interaction);
            }
        })
    }

    private getInteractionInfo(interaction: Interaction): InteractionIdentifier | undefined {
        if (interaction.isCommand()){
            if(interaction.isChatInputCommand()) return { type: InteractionType.SLASH, identifier: interaction.commandName }
            if(interaction.isContextMenuCommand()){
                if(interaction.isMessageContextMenuCommand()) return { type: InteractionType.MESSAGE_CONTEXT_MENU, identifier: interaction.commandName }
                if(interaction.isUserContextMenuCommand()) return { type: InteractionType.USER_CONTEXT_MENU, identifier: interaction.commandName }
            }
            if (interaction.isPrimaryEntryPointCommand()) return { type: InteractionType.PRIMARY_ENTRY_POINT, identifier: interaction.commandName };
                return undefined
        }
        if(interaction.isMessageComponent()){
            if (interaction.isButton()) return { type: InteractionType.BUTTON, identifier: interaction.customId };
            if (interaction.isStringSelectMenu()) return { type: InteractionType.SELECT_MENU, identifier: interaction.customId };
            return undefined
        }
        if (interaction.isModalSubmit()) return { type: InteractionType.MODAL, identifier: interaction.customId };
        if (interaction.isAutocomplete()) return { type: InteractionType.AUTOCOMPLETE, identifier: interaction.commandName };

        return undefined
    }

    private async handle(interactionMap: InteractionMap, infos: InteractionIdentifier, interaction: Interaction) {

        // InteractionMatchType.EXACT
        let handler = interactionMap[infos.identifier];
        if(handler){
            await handler(interaction);
            return
        }

        // InteractionMatchType.START_WITH
        let prefix: string | undefined;
        for (const key of this.startWithSet) {
            if (infos.identifier.startsWith(key)) {
                prefix = key;
                break;
            }
        }

        // InteractionMatchType.END_WITH
        if(!prefix){
            for (const key of this.endWithSet) {
                if (infos.identifier.endsWith(key)) {
                    prefix = key;
                    break;
                }
            }
        }

        if (prefix) {
            handler = interactionMap[prefix];
            if(handler){
                await handler(interaction);
                return
            }
        }

        if (!handler) {
            throw new Error(`No handler registered for "${infos.identifier}"`);
        }
    }

    public register(type: InteractionType, interaction: { name: string; func: InteractionHandler, matchType: InteractionMatchType }): boolean {
        return this._register(type, {key: interaction.name, value: interaction.func, matchType: interaction.matchType});
    }

    private createMap(name: string, func: (...args: any[]) => any, matchType: InteractionMatchType): {key: string, value: InteractionHandler, matchType: InteractionMatchType} {
        return {
            key: name,
            value: func,
            matchType: matchType
        };
    }
    private _register(type: InteractionType, interaction: { key: string; value: InteractionHandler, matchType: InteractionMatchType }): boolean {
        if (Object.hasOwn(this.interactionMap[type], interaction.key)) {
            throw new Error(`Duplicate entry when registering ${type}`)
        }
        this.interactionMap[type][interaction.key] = interaction.value;

        if(interaction.matchType == InteractionMatchType.START_WITH){
            this.startWithSet.add(interaction.key)
        }

        if(interaction.matchType == InteractionMatchType.EXACT){
            this.endWithSet.add(interaction.key)
        }
        return true;
    }

    public registerAutocomplete(name: string, func: (...args: any[]) => any, matchType: InteractionMatchType = InteractionMatchType.EXACT): boolean{
        return this._register(InteractionType.AUTOCOMPLETE, this.createMap(name, func, matchType))
    }
    public registerButton(name: string, func: (...args: any[]) => any, matchType: InteractionMatchType = InteractionMatchType.EXACT): boolean{
        return this._register(InteractionType.BUTTON, this.createMap(name, func, matchType))
    }
    public registerMessageContextMenus(name: string, func: (...args: any[]) => any, matchType: InteractionMatchType = InteractionMatchType.EXACT): boolean{
        return this._register(InteractionType.MESSAGE_CONTEXT_MENU, this.createMap(name, func, matchType))
    }
    public registerUserContextMenus(name: string, func: (...args: any[]) => any, matchType: InteractionMatchType = InteractionMatchType.EXACT): boolean{
        return this._register(InteractionType.USER_CONTEXT_MENU, this.createMap(name, func, matchType))
    }
    public registerModal(name: string, func: (...args: any[]) => any, matchType: InteractionMatchType = InteractionMatchType.EXACT): boolean{
        return this._register(InteractionType.MODAL, this.createMap(name, func, matchType))
    }
    public registerPrimaryEntryPoint(name: string, func: (...args: any[]) => any, matchType: InteractionMatchType = InteractionMatchType.EXACT): boolean{
        return this._register(InteractionType.PRIMARY_ENTRY_POINT, this.createMap(name, func, matchType))
    }
    public registerSelectMenu(name: string, func: (...args: any[]) => any, matchType: InteractionMatchType = InteractionMatchType.EXACT): boolean{
        return this._register(InteractionType.SELECT_MENU, this.createMap(name, func, matchType))
    }
    public registerSlash(name: string, func: (...args: any[]) => any, matchType: InteractionMatchType = InteractionMatchType.EXACT): boolean{
        return this._register(InteractionType.SLASH, this.createMap(name, func, matchType));
    }

}
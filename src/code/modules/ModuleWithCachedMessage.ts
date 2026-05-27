import {ModuleWithCache} from "./ModuleWithCache";
import {GuildBasedChannel, Message, MessageCreateOptions, MessageEditOptions} from "discord.js";
import {Log} from "@spatulox/utils";

interface ModuleWithCachedMessageCache {
    channel_id: string,
    message_id: string
}

/**
 * You need to call initCache in the constructor in order to init the cache and load it
 */
export abstract class ModuleWithCachedMessage extends ModuleWithCache<ModuleWithCachedMessageCache>{

    protected override async loadCache(){
        await super.loadCache()
        await this.ensureMessageExist(true)
        await this.updateOrSendMessage()
    }

    private _message: Message | null = null

    abstract getChannel(): Promise<GuildBasedChannel | null>
    abstract buildMessage(): string | MessageCreateOptions
    abstract editMessage(): string | MessageEditOptions

    protected cacheData: ModuleWithCachedMessageCache = {channel_id:"", message_id:""}

    get message(): Message | null {
        return this._message
    }

    protected async triggerUpdateMessage() {
        await this.updateOrSendMessage()
    }

    private async updateOrSendMessage(){
        try {
            if(this._message !== null){
                await this.updateMessage()
            } else {
                await this.sendMessage()
            }
        } catch (e) {
            Log.info(`${e}`)
        }
    }

    private async updateMessage(){
        try {
            if(!this._message) return
            await this._message.edit(this.editMessage())
        } catch(err){
            Log.info(`${err}`)
        }
    }

    private async sendMessage(){
        try {
            const channel = await this.getChannel()
            if(!channel || !channel?.isSendable()) return
            const msg = await channel.send(this.buildMessage())

            this.cacheData.channel_id = channel.id
            this.cacheData.message_id = msg.id
            this._message = msg
            await this.syncCache(this.cacheData)
        } catch(err){
            Log.info(`${err}`)
        }
    }

    private async ensureMessageExist(initMsg: boolean = false): Promise<boolean> {
        try {
            if(this.cacheData.message_id == null || this.cacheData.message_id == "") {
                return false
            }
            const channel = await this.getChannel()
            if(!channel) return false
            if(!channel.isTextBased()) return false
            const msg = await channel.messages.fetch(this.cacheData.message_id)
            if(initMsg) {
                this._message = msg
            }
            return msg !== null
        } catch(err){
            Log.info(`${err}`)
            return false
        }
    }
}
import {ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Client} from "discord.js";

export class BtnModuleTest {
    static async test(interaction: ButtonInteraction):Promise<void> {
        if(interaction.customId == "btn_test1"){
            await interaction.reply("Btn test 1")
            return
        }

        if(interaction.customId == "btn_test2"){
            await interaction.reply("Btn test 2")
            return
        }

        if(interaction.customId.startsWith("btn")){
            await interaction.reply("Other B")
            return
        }
    }

    static async sendMessageWithbutton(client: Client, channelID: string){
        const channel = client?.channels.cache.get(channelID) || await client?.channels.fetch(channelID)
        if(!channel){
            throw new Error(`Channel (${channelID}) does not exist or is unavailable`);
        }

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                    .setCustomId("btn_test1")
                    .setLabel("First button")
                    .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("btn_test2")
                .setLabel("Second button")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("btn_other")
                .setLabel("Other button")
                .setStyle(ButtonStyle.Danger)
        );

        if(channel.isTextBased() && channel.isSendable()){
            channel.send({
                components: [buttonRow]
            })
        }
    }
}
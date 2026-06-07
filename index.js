const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const express = require('express');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const app = express();
app.get('/', (req, res) => res.send('Dynamic Form Bot Engine Active.'));
app.listen(process.env.PORT || 3000);

// Server Tracker Configs
const staffRoles = ['1506139327023808533', '1509798830835503225', '1513112567676145839'];
const staffChannelId = '1512930000163045587';

// We only need a temporary map for answers mid-process. Questions are safely stored on Discord!
const temporaryAnswers = new Map();

client.on('interactionCreate', async (interaction) => {

    // ────────────────────────────────────────────────────────
    // PART A: COMMAND SETUP (PACKS QUESTIONS INTO THE BUTTON)
    // ────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'create_application') {
        const hasRole = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));
        if (!hasRole) return interaction.reply({ content: '❌ No permission.', ephemeral: true });

        const title = interaction.options.getString('title');
        const information = interaction.options.getString('information');

        const customQuestionsList = [];
        for (let i = 1; i <= 10; i++) {
            const qText = interaction.options.getString(`question_${i}`);
            if (qText) customQuestionsList.push(qText.replace(/\|/g, '')); // Remove vertical bars to avoid splitting bugs
        }

        // Encapsulate the questions directly inside the button ID, separated by "|"
        const serializedQuestions = customQuestionsList.join('|');
        
        // Discord limits custom IDs to 100 characters. If your total text is too long, we keep an explicit warning!
        if (serializedQuestions.length > 75) {
            return interaction.reply({ content: '❌ Your questions combined are too long! Keep the total text short so Discord can store them safely inside the button.', ephemeral: true });
        }

        const openEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`## ${title}\n\n${information}\n\nClick below to begin. This form contains **${customQuestionsList.length} total questions**.`)
            .setFooter({ text: 'Application Processing System' });

        const openRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`start_dyn_app_p1_${serializedQuestions}`) // 👈 Questions saved here forever!
                .setLabel('Apply Here')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({ embeds: [openEmbed], components: [openRow] });
        return interaction.reply({ content: '✅ Custom application posted successfully!', ephemeral: true });
    }

    // ────────────────────────────────────────────────────────
    // PART B: DISPLAY PAGE 1 (Up to the first 5 questions)
    // ────────────────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith('start_dyn_app_p1_')) {
        // Extract the questions array back out from the button ID string
        const questionsStr = interaction.customId.replace('start_dyn_app_p1_', '');
        const questions = questionsStr.split('|').filter(Boolean);

        if (questions.length === 0) return interaction.reply({ content: '❌ No questions found embedded inside this application.', ephemeral: true });

        const modal = new ModalBuilder().setCustomId(`sub_dyn_p1_${questionsStr}`).setTitle('Application: Part 1');
        
        const page1Limit = Math.min(questions.length, 5);
        for (let i = 0; i < page1Limit; i++) {
            const input = new TextInputBuilder()
                .setCustomId(`dyn_q_${i}`)
                .setLabel(questions[i].substring(0, 45)) 
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
        }

        return interaction.showModal(modal);
    }

    // ────────────────────────────────────────────────────────
    // PART C: CAPTURE PAGE 1 & SHOW PAGE 2 IF NEEDED
    // ────────────────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId.startsWith('sub_dyn_p1_')) {
        const questionsStr = interaction.customId.replace('sub_dyn_p1_', '');
        const questions = questionsStr.split('|').filter(Boolean);
        const page1Limit = Math.min(questions.length, 5);
        
        const answersCache = {};
        for (let i = 0; i < page1Limit; i++) {
            answersCache[questions[i]] = interaction.fields.getTextInputValue(`dyn_q_${i}`);
        }
        
        temporaryAnswers.set(interaction.user.id, answersCache);

        if (questions.length <= 5) {
            return compileAndSendApplication(interaction, questions);
        }

        // Pass questions down to page 2 through the next green button's ID
        const nextRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`start_dyn_app_p2_${questionsStr}`).setLabel('Click to open Part 2').setStyle(ButtonStyle.Success)
        );

        return interaction.reply({
            content: '✅ Part 1 saved. Click below to answer the remaining custom questions.',
            components: [nextRow],
            ephemeral: true
        });
    }

    if (interaction.isButton() && interaction.customId.startsWith('start_dyn_app_p2_')) {
        const questionsStr = interaction.customId.replace('start_dyn_app_p2_', '');
        const questions = questionsStr.split('|').filter(Boolean);
        
        const modal = new ModalBuilder().setCustomId(`sub_dyn_p2_${questionsStr}`).setTitle('Application: Part 2');

        for (let i = 5; i < questions.length; i++) {
            const input = new TextInputBuilder()
                .setCustomId(`dyn_q_${i}`)
                .setLabel(questions[i].substring(0, 45))
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
        }

        return interaction.showModal(modal);
    }

    // ────────────────────────────────────────────────────────
    // PART D: CAPTURE PAGE 2 AND COMPILE FINAL SUBMISSION
    // ────────────────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId.startsWith('sub_dyn_p2_')) {
        const questionsStr = interaction.customId.replace('sub_dyn_p2_', '');
        const questions = questionsStr.split('|').filter(Boolean);
        const answersCache = temporaryAnswers.get(interaction.user.id) || {};

        for (let i = 5; i < questions.length; i++) {
            answersCache[questions[i]] = interaction.fields.getTextInputValue(`dyn_q_${i}`) || 'None provided';
        }

        temporaryAnswers.set(interaction.user.id, answersCache);
        return compileAndSendApplication(interaction, questions);
    }

    // ────────────────────────────────────────────────────────
    // PART E: ADMINISTRATIVE APPLICATION EVALUATION PANELS
    // ────────────────────────────────────────────────────────
    if (!interaction.isButton()) return;
    const { customId, user, message } = interaction;

    if (['app_accept', 'app_deny', 'cancel_action'].includes(customId) || customId.startsWith('confirm_')) {
        const hasRole = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));
        if (!hasRole) return interaction.reply({ content: '❌ Only authorized staff can process applications.', ephemeral: true });
    }

    if (customId === 'app_accept' || customId === 'app_deny') {
        const action = customId === 'app_accept' ? 'accept' : 'deny';
        const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`confirm_${action}_${message.id}`).setLabel('Confirm').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel_action').setLabel('Cancel').setStyle(ButtonStyle.Danger)
        );
        return interaction.reply({ content: `🤔 Confirm execution to **${action}** this candidate?`, components: [confirmRow], ephemeral: true });
    }

    if (customId === 'cancel_action') {
        return interaction.update({ content: '❌ Action aborted. Application status remains pending.', components: [] });
    }

    if (customId.startsWith('confirm_')) {
        const [, action, originalMessageId] = customId.split('_');
        try {
            const staffChannel = await interaction.guild.channels.fetch(staffChannelId);
            const originalMessage = await staffChannel.messages.fetch(originalMessageId);

            const statusLabel = action === 'accept' ? 'Accepted' : 'Denied';
            const statusStyle = action === 'accept' ? ButtonStyle.Success : ButtonStyle.Danger;

            const updatedRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('disabled_status').setLabel(statusLabel).setStyle(statusStyle).setDisabled(true)
            );

            await originalMessage.edit({ components: [updatedRow] });
            await originalMessage.reply({ content: `${action === 'accept' ? '✅' : '❌'} Application has been **${statusLabel}** by <@${user.id}>.` });
            return interaction.update({ content: `✅ Application logged as **${statusLabel}**.`, components: [] });
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: '❌ Evaluation execution failure.', ephemeral: true });
        }
    }
});

// Helper function to compile fields and send clean clean arrays to staff logs
async function compileAndSendApplication(interaction, questions) {
    const userId = interaction.user.id;
    const finalAnswers = temporaryAnswers.get(userId);

    if (!finalAnswers) {
        return interaction.reply({ content: '❌ Processing session timed out. Please retry.', ephemeral: true });
    }

    try {
        const staffChannel = await interaction.guild.channels.fetch(staffChannelId);
        
        let reportData = `**Applicant:** <@${userId}> (${interaction.user.tag})\n\n`;
        questions.forEach((qText, index) => {
            reportData += `**Q${index + 1}: ${qText}**\n👉 ${finalAnswers[qText]}\n\n`;
        });

        const reportEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📥 Custom Dynamic Application Received')
            .setDescription(reportData.substring(0, 4096)) 
            .setTimestamp();

        const evalButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('app_accept').setLabel('Accept').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('app_deny').setLabel('Deny').setStyle(ButtonStyle.Danger)
        );

        await staffChannel.send({ embeds: [reportEmbed], components: [evalButtons] });
        temporaryAnswers.delete(userId);

        const confirmationPayload = { content: '🎉 Application successfully completed and forwarded to review!', components: [] };
        if (interaction.deferred || interaction.replied) {
            return interaction.followUp({ ...confirmationPayload, ephemeral: true });
        } else {
            return interaction.update ? interaction.update(confirmationPayload) : interaction.reply({ ...confirmationPayload, ephemeral: true });
        }
    } catch (error) {
        console.error(error);
        return interaction.reply({ content: '❌ Internal pipeline delivery failed.', ephemeral: true });
    }
}

client.login(process.env.TOKEN);

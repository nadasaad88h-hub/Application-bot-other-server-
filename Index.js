const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const express = require('express');
const fs = require('fs'); // 👈 Native file manager to save your questions safely!

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const app = express();
app.get('/', (req, res) => res.send('Dynamic Form Bot Engine Active.'));
app.listen(process.env.PORT || 3000);

// Server Tracker Configs
const staffRoles = ['1506139327023808533', '1509798830835503225', '1513112567676145839'];
const staffChannelId = '1513133546754277476';

const temporaryAnswers = new Map();

// Helper to safely fetch questions from database file
function loadQuestions() {
    if (!fs.existsSync('./questions.json')) fs.writeFileSync('./questions.json', JSON.stringify({}));
    return JSON.parse(fs.readFileSync('./questions.json', 'utf8'));
}

// Helper to safely save questions to database file
function saveQuestions(data) {
    fs.writeFileSync('./questions.json', JSON.stringify(data, null, 2));
}

client.on('interactionCreate', async (interaction) => {    // ────────────────────────────────────────────────────────
    // PART B: DISPLAY PAGE 1 (Up to the first 5 questions)
    // ────────────────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith('start_dyn_app_p1_')) {
        const appId = interaction.customId.replace('start_dyn_app_p1_', '');
        const db = loadQuestions();
        const questions = db[appId] || [];

        if (questions.length === 0) return interaction.reply({ content: '❌ Application data not found. Please re-run setup command.', ephemeral: true });

        const modal = new ModalBuilder().setCustomId(`sub_dyn_p1_${appId}`).setTitle('Application: Part 1');
        
        const page1Limit = Math.min(questions.length, 5);
        for (let i = 0; i < page1Limit; i++) {
            const input = new TextInputBuilder()
                .setCustomId(`dyn_q_${i}`)
                // Bold label text safely short to prevent truncation/hiding
                .setLabel(`Question ${i + 1} (Read details inside box)`) 
                // Full uncut prompt displays beautifully inside the text layout zone
                .setPlaceholder(questions[i].substring(0, 100)) 
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
        const appId = interaction.customId.replace('sub_dyn_p1_', '');
        const db = loadQuestions();
        const questions = db[appId] || [];
        const page1Limit = Math.min(questions.length, 5);
        
        const answersCache = {};
        for (let i = 0; i < page1Limit; i++) {
            answersCache[questions[i]] = interaction.fields.getTextInputValue(`dyn_q_${i}`);
        }
        
        temporaryAnswers.set(interaction.user.id, answersCache);

        if (questions.length <= 5) {
            return compileAndSendApplication(interaction, questions);
        }

        const nextRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`start_dyn_app_p2_${appId}`).setLabel('Click to open Part 2').setStyle(ButtonStyle.Success)
        );

        return interaction.reply({
            content: '✅ Part 1 saved. Click below to answer the remaining custom questions.',
            components: [nextRow],
            ephemeral: true
        });
    }

    if (interaction.isButton() && interaction.customId.startsWith('start_dyn_app_p2_')) {
        const appId = interaction.customId.replace('start_dyn_app_p2_', '');
        const db = loadQuestions();
        const questions = db[appId] || [];
        
        const modal = new ModalBuilder().setCustomId(`sub_dyn_p2_${appId}`).setTitle('Application: Part 2');

        for (let i = 5; i < questions.length; i++) {
            const input = new TextInputBuilder()
                .setCustomId(`dyn_q_${i}`)
                // Matches the styling of Part 1 for clean visual symmetry
                .setLabel(`Question ${i + 1} (Read details inside box)`)
                .setPlaceholder(questions[i].substring(0, 100))
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
        }

        return interaction.showModal(modal);
    }

    // ────────────────────────────────────────────────────────
    // PART C: CAPTURE PAGE 1 & SHOW PAGE 2 IF NEEDED
    // ────────────────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId.startsWith('sub_dyn_p1_')) {
        const appId = interaction.customId.replace('sub_dyn_p1_', '');
        const db = loadQuestions();
        const questions = db[appId] || [];
        const page1Limit = Math.min(questions.length, 5);
        
        const answersCache = {};
        for (let i = 0; i < page1Limit; i++) {
            answersCache[questions[i]] = interaction.fields.getTextInputValue(`dyn_q_${i}`);
        }
        
        temporaryAnswers.set(interaction.user.id, answersCache);

        if (questions.length <= 5) {
            return compileAndSendApplication(interaction, questions);
        }

        const nextRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`start_dyn_app_p2_${appId}`).setLabel('Click to open Part 2').setStyle(ButtonStyle.Success)
        );

        return interaction.reply({
            content: '✅ Part 1 saved. Click below to answer the remaining custom questions.',
            components: [nextRow],
            ephemeral: true
        });
    }

    if (interaction.isButton() && interaction.customId.startsWith('start_dyn_app_p2_')) {
        const appId = interaction.customId.replace('start_dyn_app_p2_', '');
        const db = loadQuestions();
        const questions = db[appId] || [];
        
        const modal = new ModalBuilder().setCustomId(`sub_dyn_p2_${appId}`).setTitle('Application: Part 2');

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
        const appId = interaction.customId.replace('sub_dyn_p2_', '');
        const db = loadQuestions();
        const questions = db[appId] || [];
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
client.once('ready', async () => {
    console.log(`🤖 Logged in securely as ${client.user.tag}!`);

    const clientId = '1513156161753583727'; 
    const guildId = '1506139326579216415';      
    const { SlashCommandBuilder, REST, Routes } = require('discord.js');

    const commandBuilder = new SlashCommandBuilder()
        .setName('create_application')
        .setDescription('Deploys a fully dynamic custom application post.')
        .addStringOption(option => option.setName('title').setDescription('The heading title for the embed.').setRequired(true))
        .addStringOption(option => option.setName('information').setDescription('The instructions inside the embed.').setRequired(true))
        .addStringOption(option => option.setName('question_1').setDescription('Custom Question 1').setRequired(true))
        .addStringOption(option => option.setName('question_2').setDescription('Custom Question 2').setRequired(false))
        .addStringOption(option => option.setName('question_3').setDescription('Custom Question 3').setRequired(false))
        .addStringOption(option => option.setName('question_4').setDescription('Custom Question 4').setRequired(false))
        .addStringOption(option => option.setName('question_5').setDescription('Custom Question 5').setRequired(false))
        .addStringOption(option => option.setName('question_6').setDescription('Custom Question 6').setRequired(false))
        .addStringOption(option => option.setName('question_7').setDescription('Custom Question 7').setRequired(false))
        .addStringOption(option => option.setName('question_8').setDescription('Custom Question 8').setRequired(false))
        .addStringOption(option => option.setName('question_9').setDescription('Custom Question 9').setRequired(false))
        .addStringOption(option => option.setName('question_10').setDescription('Custom Question 10').setRequired(false));

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || client.token);

    try {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [commandBuilder.toJSON()] });
        console.log('✅ Success! Slash commands registered directly via index.');
    } catch (error) {
        console.error('❌ Integration Error:', error);
    }
});


client.login(process.env.TOKEN);

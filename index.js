const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

// 1. Your Server Configurations (Permanently Saved)
const staffRoles = ['1506139327023808533', '1509798830835503225', '1513112567676145839'];
const staffChannelId = '1512930000163045587';

// Temporary storage to save page 1 answers while user fills out page 2
const temporaryAnswers = new Map();

client.on('interactionCreate', async (interaction) => {

    // ────────────────────────────────────────────────────────
    // PART A: COMMAND TO POST THE PUBLIC APPLICATION SIGN-UP
    // ────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'create_application') {
            
            const hasRole = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));
            if (!hasRole) return interaction.reply({ content: '❌ No permission.', ephemeral: true });

            const title = interaction.options.getString('title') || 'Community Application';
            const information = interaction.options.getString('information') || 'Apply to join our team!';

            try {
                const publicChannel = interaction.channel; 
                
                const openEmbed = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setDescription(`## ${title}\n\n${information}\n\nClick the button below to start your application!`)
                    .setFooter({ text: 'Make sure to complete both parts of the form.' });

                const openRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('start_app_page1')
                        .setLabel('Apply Here')
                        .setStyle(ButtonStyle.Primary)
                );

                await publicChannel.send({ embeds: [openEmbed], components: [openRow] });
                return interaction.reply({ content: '✅ Application post deployed successfully!', ephemeral: true });

            } catch (err) {
                console.error(err);
                return interaction.reply({ content: '❌ Code execution failed.', ephemeral: true });
            }
        }
        return;
    }

    // ────────────────────────────────────────────────────────
    // PART B: LAUNCH PAGE 1 (5 Required Questions)
    // ────────────────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'start_app_page1') {
        const modal = new ModalBuilder()
            .setCustomId('submit_app_page1')
            .setTitle('Application: Part 1 (Required)');

        // 📝 TYPE YOUR REQUIRED QUESTIONS INSIDE THE SINGLE QUOTES BELOW:
        const q1 = new TextInputBuilder().setCustomId('req_q1').setLabel('Required Question 1').setStyle(TextInputStyle.Short).setRequired(true);
        const q2 = new TextInputBuilder().setCustomId('req_q2').setLabel('Required Question 2').setStyle(TextInputStyle.Paragraph).setRequired(true);
        const q3 = new TextInputBuilder().setCustomId('req_q3').setLabel('Required Question 3').setStyle(TextInputStyle.Paragraph).setRequired(true);
        const q4 = new TextInputBuilder().setCustomId('req_q4').setLabel('Required Question 4').setStyle(TextInputStyle.Paragraph).setRequired(true);
        const q5 = new TextInputBuilder().setCustomId('req_q5').setLabel('Required Question 5').setStyle(TextInputStyle.Paragraph).setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(q1),
            new ActionRowBuilder().addComponents(q2),
            new ActionRowBuilder().addComponents(q3),
            new ActionRowBuilder().addComponents(q4),
            new ActionRowBuilder().addComponents(q5)
        );

        return interaction.showModal(modal);
    }

    // ────────────────────────────────────────────────────────
    // PART C: CAPTURE PAGE 1 & PROMPT PAGE 2 (5 Optional Questions)
    // ────────────────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'submit_app_page1') {
        temporaryAnswers.set(interaction.user.id, {
            q1: interaction.fields.getTextInputValue('req_q1'),
            q2: interaction.fields.getTextInputValue('req_q2'),
            q3: interaction.fields.getTextInputValue('req_q3'),
            q4: interaction.fields.getTextInputValue('req_q4'),
            q5: interaction.fields.getTextInputValue('req_q5'),
        });

        const nextRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('start_app_page2')
                .setLabel('Click to open Part 2 (Optional)')
                .setStyle(ButtonStyle.Success)
        );

        return interaction.reply({
            content: '✅ Part 1 saved successfully! Click the button below to finish your application.',
            components: [nextRow],
            ephemeral: true
        });
    }

    if (interaction.isButton() && interaction.customId === 'start_app_page2') {
        const modal = new ModalBuilder()
            .setCustomId('submit_app_page2')
            .setTitle('Application: Part 2 (Optional)');

        // 📝 TYPE YOUR OPTIONAL QUESTIONS INSIDE THE SINGLE QUOTES BELOW:
        const q6 = new TextInputBuilder().setCustomId('opt_q1').setLabel('Optional Question 1').setStyle(TextInputStyle.Paragraph).setRequired(false);
        const q7 = new TextInputBuilder().setCustomId('opt_q2').setLabel('Optional Question 2').setStyle(TextInputStyle.Paragraph).setRequired(false);
        const q8 = new TextInputBuilder().setCustomId('opt_q3').setLabel('Optional Question 3').setStyle(TextInputStyle.Paragraph).setRequired(false);
        const q9 = new TextInputBuilder().setCustomId('opt_q4').setLabel('Optional Question 4').setStyle(TextInputStyle.Paragraph).setRequired(false);
        const q10 = new TextInputBuilder().setCustomId('opt_q5').setLabel('Optional Question 5').setStyle(TextInputStyle.Paragraph).setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(q6),
            new ActionRowBuilder().addComponents(q7),
            new ActionRowBuilder().addComponents(q8),
            new ActionRowBuilder().addComponents(q9),
            new ActionRowBuilder().addComponents(q10)
        );

        return interaction.showModal(modal);
    }

    // ────────────────────────────────────────────────────────
    // PART D: COMPILE ALL 10 ANSWERS & POST TO STAFF ROOM
    // ────────────────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'submit_app_page2') {
        const userId = interaction.user.id;
        const page1 = temporaryAnswers.get(userId);

        if (!page1) {
            return interaction.reply({ content: '❌ Session expired or timed out. Please start over from Part 1.', ephemeral: true });
        }

        const opt1 = interaction.fields.getTextInputValue('opt_q1') || 'None provided';
        const opt2 = interaction.fields.getTextInputValue('opt_q2') || 'None provided';
        const opt3 = interaction.fields.getTextInputValue('opt_q3') || 'None provided';
        const opt4 = interaction.fields.getTextInputValue('opt_q4') || 'None provided';
        const opt5 = interaction.fields.getTextInputValue('opt_q5') || 'None provided';

        try {
            const staffChannel = await interaction.guild.channels.fetch(staffChannelId);
            if (!staffChannel) return interaction.reply({ content: '❌ Staff channel configurations missing.', ephemeral: true });
            
            const submissionEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📥 New Local Application Submitted')
                .setDescription(`**Applicant:** <@${userId}> (${interaction.user.tag})\n\n` +
                                `### 🟢 Required Answers:\n` +
                                `* **Q1:** ${page1.q1}\n* **Q2:** ${page1.q2}\n* **Q3:** ${page1.q3}\n* **Q4:** ${page1.q4}\n* **Q5:** ${page1.q5}\n\n` +
                                `### 🟡 Optional Answers:\n` +
                                `* **Q6:** ${opt1}\n* **Q7:** ${opt2}\n* **Q8:** ${opt3}\n* **Q9:** ${opt4}\n* **Q10:** ${opt5}`)
                .setTimestamp();

            const evaluationButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('app_accept').setLabel('Accept').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('app_deny').setLabel('Deny').setStyle(ButtonStyle.Danger)
            );

            await staffChannel.send({ embeds: [submissionEmbed], components: [evaluationButtons] });
            
            temporaryAnswers.delete(userId);

            return interaction.update({
                content: '🎉 Thank you! Your application answers have been sent directly to our staff team for evaluation.',
                components: []
            });

        } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Failed sending entry to staff channel.', ephemeral: true });
        }
    }

    // ────────────────────────────────────────────────────────
    // PART E: EVALUATION MANAGER (Staff Action Triggers)
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

        return interaction.reply({
            content: `🤔 Are you sure you would like to **${action}** this application?`,
            components: [confirmRow],
            ephemeral: true
        });
    }

    if (customId === 'cancel_action') {
        return interaction.update({
            content: '❌ Action cancelled. The application remains pending.',
            components: [] 
        });
    }

    if (customId.startsWith('confirm_')) {
        const [, action, originalMessageId] = customId.split('_');
        
        try {
            const staffChannel = await interaction.guild.channels.fetch(staffChannelId);
            const originalMessage = await staffChannel.messages.fetch(originalMessageId);

            if (action === 'accept') {
                const updatedRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('app_accepted_disabled').setLabel('Accepted').setStyle(ButtonStyle.Success).setDisabled(true)
                );
                await originalMessage.edit({ components: [updatedRow] });
                await originalMessage.reply({ content: `✅ Application has been Accepted by <@${user.id}>` });

            } else if (action === 'deny') {
                const updatedRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('app_denied_disabled').setLabel('Denied').setStyle(ButtonStyle.Danger).setDisabled(true)
                );
                await originalMessage.edit({ components: [updatedRow] });
                await originalMessage.reply({ content: `❌ Application has been denied by <@${user.id}>` });
            }

            await interaction.update({
                content: `✅ Successfully processed application as **${action}ed**!`,
                components: []
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Error updating execution status.', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);

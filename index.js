const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// CHANGE THIS LINE AT THE TOP OF YOUR NOTE:
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages
    ] 
});

// 1. Define your constant configurations at the top
const staffRoles = ['1506139327023808533', '1509798830835503225', '1513112567676145839'];
const rolePings = staffRoles.map(id => `<@&${id}>`).join(' ');
const staffChannelId = '1512930000163045587';

// 2. Main Gateway: Listens for ALL interactions (Commands & Buttons)
client.on('interactionCreate', async (interaction) => {

    // ────────────────────────────────────────────────────────
    // PART A: THE COMMAND TO CREATE THE APPLICATION EMBED
    // ────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'create_application') {
            
            // Authorization Check
            const hasRole = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));
            if (!hasRole) {
                return interaction.reply({ 
                    content: '❌ You do not have permission to use this command.', 
                    ephemeral: true 
                });
            }

            // Extract User Options
            const title = interaction.options.getString('title');
            const information = interaction.options.getString('information');
            const duration = interaction.options.getString('duration');
            const formLink = interaction.options.getString('form_link');

            // Validate Info Length
            if (information.length < 50) {
                return interaction.reply({
                    content: `❌ The information text must be at least 50 characters long. (You provided ${information.length} characters).`,
                    ephemeral: true
                });
            }

            try {
                // Fetch target channel and push the embed
                const targetChannel = await interaction.guild.channels.fetch(staffChannelId);
                if (!targetChannel) {
                    return interaction.reply({ content: '❌ Target channel not found.', ephemeral: true });
                }

                const appEmbed = new EmbedBuilder()
                    .setColor('#2b2d31') 
                    .setDescription(`## ${title}\n\n${information}\n\n⏳ **Duration:** ${duration}\n\n📝 **Apply Here:** [Click here to open the Application](${formLink})`)
                    .setFooter({ text: 'Make sure to read all instructions before applying!' })
                    .setTimestamp();

                await targetChannel.send({ embeds: [appEmbed] });

                return interaction.reply({ 
                    content: '✅ Application has been successfully created.', 
                    ephemeral: true 
                });

            } catch (error) {
                console.error(error);
                return interaction.reply({ content: '❌ Something went wrong while posting the embed.', ephemeral: true });
            }
        }
        return; // Stops execution here so commands don't hit button logic
    }

    // ────────────────────────────────────────────────────────
    // PART B: THE ACTION HANDLING FOR THE ACCEPT/DENY BUTTONS
    // ────────────────────────────────────────────────────────
    if (!interaction.isButton()) return;

    const { customId, user, message } = interaction;
    
    // Ensure only authorized staff can press these buttons
    const hasRole = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));
    if (!hasRole) {
        return interaction.reply({ content: '❌ Only authorized staff can process applications.', ephemeral: true });
    }

    // --- STEP 1: INITIAL BUTTON CLICK (ACCEPT/DENY) ---
    if (customId === 'app_accept' || customId === 'app_deny') {
        const action = customId === 'app_accept' ? 'accept' : 'deny';

        const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_${action}_${message.id}`)
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cancel_action')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({
            content: `🤔 Are you sure you would like to **${action}** this application?`,
            components: [confirmRow],
            ephemeral: true
        });
    }

    // --- STEP 2: HANDLE CANCEL ---
    if (customId === 'cancel_action') {
        return interaction.update({
            content: '❌ Action cancelled. The application remains pending.',
            components: [] 
        });
    }

    // --- STEP 3: HANDLE CONFIRMATION ---
    if (customId.startsWith('confirm_')) {
        const [, action, originalMessageId] = customId.split('_');
        
        try {
            const staffChannel = await interaction.guild.channels.fetch(staffChannelId);
            if (!staffChannel) return interaction.reply({ content: '❌ Staff channel not found.', ephemeral: true });

            const originalMessage = await staffChannel.messages.fetch(originalMessageId);
            if (!originalMessage) {
                return interaction.reply({ content: '❌ Original application message not found.', ephemeral: true });
            }

            if (action === 'accept') {
                const updatedRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('app_accepted_disabled')
                        .setLabel('Accepted')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true)
                );

                await originalMessage.edit({ components: [updatedRow] });
                await originalMessage.reply({ content: `✅ Application has been Accepted by <@${user.id}>` });

            } else if (action === 'deny') {
                const updatedRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('app_denied_disabled')
                        .setLabel('Denied')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );

                await originalMessage.edit({ components: [updatedRow] });
                await originalMessage.reply({ content: `❌ Application has been denied by <@${user.id}>` });
            }

            await interaction.update({
                content: `✅ Successfully processed application as **${action}ed**!`,
                components: []
            });

        } catch (error) {
            console.error("Error processing confirmation:", error);
            await interaction.reply({ content: '❌ An error occurred while updating the application status.', ephemeral: true });
        }
    }
});

// Log your bot in using your environment variable token
client.login(process.env.TOKEN);

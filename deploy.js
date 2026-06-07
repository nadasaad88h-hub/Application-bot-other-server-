const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

// 1. Put your custom server details here
const clientId = '1513156161753583727'; // 👈 Replace with your Bot's Client ID
const guildId = '1506139326579216415';      // 👈 Replace with your Server's ID

const commands = [
    {
        name: 'create_application',
        description: 'Deploys the application sign-up post to this channel.',
        options: [
            {
                name: 'title',
                description: 'The main heading title for the embed box.',
                type: ApplicationCommandOptionType.String,
                required: false,
            },
            {
                name: 'information',
                description: 'The text instructions inside the embed box.',
                type: ApplicationCommandOptionType.String,
                required: false,
            }
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('✅ Successfully reloaded application (/) commands!');
    } catch (error) {
        console.error(error);
    }
})();

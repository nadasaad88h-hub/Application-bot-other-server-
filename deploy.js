const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

// 1. Put your custom server details here
const clientId = '1513156161753583727'; // 👈 Replace with your Bot's Client ID
const guildId = '1506139326579216415';      // 👈 Replace with your Server's ID

const commands = [
    {
        name: 'create_application',
        description: 'Deploys a fully dynamic custom application post.',
        options: [
            { name: 'title', description: 'The heading title for the embed.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'information', description: 'The instructions inside the embed.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'question_1', description: 'Custom Question 1', type: ApplicationCommandOptionType.String, required: true },
            { name: 'question_2', description: 'Custom Question 2', type: ApplicationCommandOptionType.String, required: false },
            { name: 'question_3', description: 'Custom Question 3', type: ApplicationCommandOptionType.String, required: false },
            { name: 'question_4', description: 'Custom Question 4', type: ApplicationCommandOptionType.String, required: false },
            { name: 'question_5', description: 'Custom Question 5', type: ApplicationCommandOptionType.String, required: false },
            { name: 'question_6', description: 'Custom Question 6', type: ApplicationCommandOptionType.String, required: false },
            { name: 'question_7', description: 'Custom Question 7', type: ApplicationCommandOptionType.String, required: false },
            { name: 'question_8', description: 'Custom Question 8', type: ApplicationCommandOptionType.String, required: false },
            { name: 'question_9', description: 'Custom Question 9', type: ApplicationCommandOptionType.String, required: false },
            { name: 'question_10', description: 'Custom Question 10', type: ApplicationCommandOptionType.String, required: false },
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Updating dynamic application slash command configurations...');
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        console.log('✅ Success! Slash commands updated. You can run your Render command shuffle now.');
    } catch (error) {
        console.error(error);
    }
})();

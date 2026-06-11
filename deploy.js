const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// 1. Double-check these credentials match your Discord Developer Portal precisely!
const clientId = '1513156161753583727'; 
const guildId = '1506139326579216415';      

// 2. Build out the command using standard v14 factory syntax
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

const commands = [commandBuilder.toJSON()];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Updating dynamic application slash command configurations...');
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        console.log('✅ Success! Slash commands updated natively in target Guild ecosystem.');
    } catch (error) {
        console.error('❌ DISCORD API COUPLING ERROR:', error);
    }
})();

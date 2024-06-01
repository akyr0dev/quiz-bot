const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { v4: uuidv4 } = require('uuid');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});
const { token, guildId, clientId } = require('./config.json')

const countries = {
    "France": { capital: "Paris", image: "https://media.discordapp.net/attachments/1246052658377134201/1246052684956434432/FRANCE.png?ex=665afc7e&is=6659aafe&hm=bc49bd9476d649fb8070d2b268ae44ddf270bd1185fc43dd404d974446b7e8d4&=&format=webp&quality=lossless" },
    "Allemange": { capital: "Berlin", image: "https://media.discordapp.net/attachments/1246052658377134201/1246053175052599397/GERMANY.png?ex=665afcf3&is=6659ab73&hm=217d752e858ef74baa974c343b171b9be77b2cb5a4645778f5d0b05419dfaeb7&=&format=webp&quality=lossless" },
    "Italy": { capital: "Rome", image: "https://media.discordapp.net/attachments/1246052658377134201/1246053845621280858/ITALIE.png?ex=665afd93&is=6659ac13&hm=3b48fe58e40aca7ade078850ad6f15ddd0cc8b53ea7b7bab2a01f866c1c2e8c9&=&format=webp&quality=lossless" },
    "Espagne": { capital: "Madrid", image: "https://media.discordapp.net/attachments/1246052658377134201/1246054335800934420/image.png?ex=665afe08&is=6659ac88&hm=c9eb50819769e3967af5fae9261151fe1b64013396d9ea5fe278cba0e6f35160&=&format=webp&quality=lossless" },
    "Suisse": { capital: "Berne", image: "https://media.discordapp.net/attachments/1246052658377134201/1246058173022863463/image.png?ex=665b019b&is=6659b01b&hm=32175be5a0f42fb587b219ef5001559c5e932fdf6ee6b2d1eabd2877bb641963&=&format=webp&quality=lossless" },
    "Pays-Bas": { capital: "Amsterdam", image: "https://media.discordapp.net/attachments/1246052658377134201/1246057781304496179/image.png?ex=665b013d&is=6659afbd&hm=5390920501944c0debefb7962f83152cb244c64070699802aafc84b9f6d6afce&=&format=webp&quality=lossless" },
    "Australie": { capital: "Canberra", image: "https://media.discordapp.net/attachments/1246052658377134201/1246056323313827900/image.png?ex=665affe2&is=6659ae62&hm=57b796be352e093b08b151d85d721b074e6270e3daf72f4b327adb884ff988ec&=&format=webp&quality=lossless&width=550&height=314" },
    "Algerie": { capital: "Alger", image: "https://media.discordapp.net/attachments/1246052658377134201/1246059166196432958/image.png?ex=665b0287&is=6659b107&hm=ca0b6d12ac3a1dcb27bd355d71729a67e5969675e854659223a18d13eebadd56&=&format=webp&quality=lossless&width=1225&height=701"},
};

let currentQuiz = {};

const commands = [
    new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start a country quiz')
];
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Chargement des commandes slashs...');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: [{ name: 'setup', description: 'Setup the bot' }] },
        );

        console.log('Les commandes slashs on bien été charger !');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log('----------------------------')
    console.log('BOT MADE BY B2B TEAM')
    console.log(`${client.user.tag} est connecter.`);
    console.log('----------------------------')
  });

const startQuiz = async (channel, user) => {
    const countryNames = Object.keys(countries);
    const randomCountry = countryNames[Math.floor(Math.random() * countryNames.length)];
    const countryData = countries[randomCountry];
    
    if (!countryData || typeof countryData.capital !== 'string' || typeof countryData.image !== 'string') {
        console.error(`Invalid data for country: ${randomCountry}`);
        return;
    }
    
    const capital = countryData.capital;
    const image = countryData.image;
    const quizId = uuidv4();

    currentQuiz[user.id] = {
        country: randomCountry,
        capital: capital.toLowerCase(),
        quizId: quizId
    };

    const embed = new EmbedBuilder()
        .setTitle('Country Quiz')
        .setDescription(`Quelle est la capitale de **${randomCountry}** ? \n *Faites bien attention a l'orthographe.*`)
        .setColor('#ffffff')
        .setImage(image)
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });

    await channel.send({ embeds: [embed] });
};

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'start') {
        await startQuiz(interaction.channel, interaction.user);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const userQuiz = currentQuiz[message.author.id];

    if (userQuiz) {
        const userAnswer = message.content.toLowerCase().trim();
        const correctAnswer = userQuiz.capital;

        if (userAnswer === correctAnswer) {
            const embed = new EmbedBuilder()
                .setTitle('Country Quiz')
                .setDescription(`Gagné ! Vous avez trouver la bonne réponse qui était **${userQuiz.capital}** !`)
                .setColor('#00ff13')
                .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() });

            await message.reply({ embeds: [embed] });

            delete currentQuiz[message.author.id];
            await startQuiz(message.channel, message.author);
        } else {
            const embed = new EmbedBuilder()
                .setTitle('Country Quiz')
                .setDescription(`Perdu ! Vous n'avez trouver la bonne réponse qui était **${userQuiz.capital}**.`)
                .setColor('#ff0000')
                .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() });

            await message.reply({ embeds: [embed] });

            delete currentQuiz[message.author.id];
        }
    }
});

client.login(token);

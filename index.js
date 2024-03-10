const { Client, GatewayIntentBits,  ApplicationCommandOptionType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const rawConfig = fs.readFileSync('config.json');
const config = JSON.parse(rawConfig);

const token = config.token;
const clientId = config.clientId;
const guildId = config.guildId;

console.log('Token:', token);
console.log('Client ID:', clientId);
console.log('Guild ID:', guildId);

const commands = [
  {
    name: 'ban',
    description: 'Bannt einen Benutzer vom Server',
    type: 1,
    options: [
      {
        name: 'user',
        description: 'Der Benutzer, den du bannen möchtest',
        type: 3,
        required: true,
      },
      {
        name: 'reason',
        description: 'Der Grund für den Bann',
        type: 3, 
        required: false,
      },
    ],
  },
  { 
    name: 'unban',
    description: 'Entbannt einen zuvor gebannten Benutzer',
    type: 1,
    options: [
      {
        name: 'user',
        description: 'Der Benutzer oder die User-ID, den/die du entbannen möchtest',
        type: 6, 
        required: true,
      },
      {
        name: 'reason',
        description: 'Der Grund für den Entbann',
        type: 3, 
        required: false,
      },
    ],
  },
  {
    name: 'tempban',
    description: 'Bannt einen Benutzer temporär vom Server',
    type: 1,
    options: [
      {
        name: 'user',
        description: 'Der Benutzer, der temporär gebannt werden soll.',
        type: 6,
        required: true,
      },
      {
        name: 'duration',
        description: 'Die Dauer des temporären Bans.',
        type: 3,
        required: true,
        choices: [
          { name: '30 Minuten', value: '30m' },
          { name: '1 Stunde', value: '1h' },
          { name: '2 Stunden', value: '2h' },
          { name: '3 Stunden', value: '3h' },
          { name: '4 Stunden', value: '4h' },
          { name: '5 Stunden', value: '5h' },
          { name: '6 Stunden', value: '6h' },
          { name: '7 Stunden', value: '7h' },
          { name: '8 Stunden', value: '8h' },
          { name: '9 Stunden', value: '9h' },
          { name: '10 Stunden', value: '10h' },
          { name: '12 Stunden', value: '12h' },
          { name: '24 Stunden', value: '24h' },
          { name: '48 Stunden', value: '48h' },
          { name: '72 Stunden', value: '72h' },
          { name: '96 Stunden', value: '96h' },
          { name: '120 Stunden', value: '120h' },
          { name: '144 Stunden', value: '144h' },
          { name: '168 Stunden', value: '168h' },
        ],
      },
      {
        name: 'reason',
        description: 'Der Grund für den temporären Ban.',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'mute',
    description: 'Muted einen Benutzer für eine bestimmte Dauer',
    type: 1,
    options: [
      {
        name: 'user',
        description: 'Der Benutzer, den du muten möchtest',
        type: 6,
        required: true,
      },
      {
        name: 'duration',
        description: 'Die Dauer des Mutes (z.B. 30m, 1h, 2h)',
        type: 3,
        required: true,
      },
    ],
  },
    {
      name: 'verlosung',
      description: 'Startet eine Verlosung.',
      type: 1,
      options: [
          {
              name: 'dauer',
              description: 'Die Dauer der Verlosung.',
              type: 3,
              required: true,
          },
          {
              name: 'preis',
              description: 'Der Preis der Verlosung.',
              type: 3,
              required: true,
          },
          {
              name: 'text',
              description: 'Zusätzlicher Text für die Verlosung.',
              type: 3,
              required: false,
          },
      ],
    },
   ]
  
const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions] });


client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.application?.commands.set(commands)
  .then(() => console.log('Slash-Befehle erfolgreich registriert!'))
  .catch(console.error);

async function setUnmuteTimer(guild, user, muteDuration) {
  setTimeout(async () => {
    try {
      const member = await guild.members.fetch(user);
      const muteRole = guild.roles.cache.find(role => role.name === 'Muted');

      if (muteRole && member.roles.cache.has(muteRole.id)) {
        await member.roles.remove(muteRole);
        console.log(`Benutzer ${user.tag} wurde entmuted.`);
      }
    } catch (error) {
      console.error('Fehler beim Entmuten:', error);
    }
  }, muteDuration);
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = interaction.commandName;

  if (command === 'ban') {
    const allowedRoles = ['Moderator', 'Moderator+', 'Developer', 'Admin', 'Inhaber'];
    
    if (!interaction.member.roles.cache.some(role => allowedRoles.includes(role.name))) {
        return interaction.reply('Du hast nicht die Berechtigung, diesen Befehl zu verwenden.');
    }

    const userOption = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';

    if (!userOption) {
        return interaction.reply('Bitte gib einen Benutzer an, den du bannen möchtest.');
    }

    try {
        const user = await client.users.fetch(userOption.id);
        await interaction.guild.members.ban(user, { reason });

        const embed = {
            color: 0xff0000,
            title: 'Benutzer gebannt',
            description: `Benutzer ${user.tag} wurde aus dem Server gebannt.`,
            fields: [
                { name: 'Grund', value: reason },
            ],
            timestamp: new Date(),
            footer: {
                text: `Server: ${interaction.guild.name}`,
                icon_url: interaction.guild.iconURL({ dynamic: true }) || undefined,
            },
            thumbnail: {
                url: user.displayAvatarURL(),
            },
        };

        interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Fehler beim Bannen des Benutzers:', error);
        interaction.reply('Ein Fehler ist aufgetreten. Der Benutzer konnte nicht gebannt werden.');
    }

  } else if (command === 'unban') {
    const allowedRoles = ['Moderator', 'Moderator+', 'Developer', 'Admin', 'Inhaber'];
    
    if (!interaction.member.roles.cache.some(role => allowedRoles.includes(role.name))) {
        return interaction.reply('Du hast nicht die Berechtigung, diesen Befehl zu verwenden.');
    }

    const userOption = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';

    if (!userOption) {
        return interaction.reply('Bitte gib einen Benutzer an, den du bannen möchtest.');
    }

    try {
        const user = await client.users.fetch(userOption.id);
        await interaction.guild.members.unban(user, { reason });

        const embed = {
            color: 0x00FF00,
            title: 'Benutzer entbannt',
            description: `Benutzer mit der User-ID ${user} wurde erfolgreich entbannt.`,
            fields: [
                { name: 'Grund', value: reason },
            ],
            timestamp: new Date(),
            footer: {
                text: `Server: ${interaction.guild.name}`,
                icon_url: interaction.guild.iconURL({ dynamic: true }) || undefined,
            },
        };

        interaction.reply({ embeds: [embed] });
    } catch (error) {
        if (error.code === 10026) {
            const notBannedEmbed = {
                color: 0xff0000,
                title: 'Benutzer nicht gebannt',
                description: `Benutzer mit der ID ${user} ist auf diesem Server nicht gebannt.`,
                timestamp: new Date(),
                footer: {
                    text: `Server: ${interaction.guild.name}`,
                    icon_url: interaction.guild.iconURL({ dynamic: true }) || undefined,
                },
            };

            interaction.reply({ embeds: [notBannedEmbed] });
        } else {
            console.error(error);
            interaction.reply('Ein Fehler ist aufgetreten. Der Benutzer konnte nicht entbannt werden.');
        }
    }

  } else if (command === 'tempban') {
    const allowedRoles = ['Supporter+' ,'Moderator', 'Moderator+', 'Developer', 'Admin', 'Inhaber'];
    
    if (!interaction.member.roles.cache.some(role => allowedRoles.includes(role.name))) {
        return interaction.reply('Du hast nicht die Berechtigung, diesen Befehl zu verwenden.');
    }

    const userOption = interaction.options.getString('user');
    const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';

    if (!userOption) {
        return interaction.reply('Bitte gib einen Benutzer an, den du temporär bannen möchtest.');
    }

    const userId = userOption.match(/\d+/)[0]; // Extrahiere die Benutzer-ID aus der Erwähnung

    try {
        const user = await client.users.fetch(userId);
        
        const durationString = interaction.options.getString('duration');
        const durationChoice = interaction.options.getString('duration', true); // true für convertChoices, um den Wert der Auswahl abzurufen
        
        if (!['30m', '1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h', '10h', '12h', '24h', '48h', '72h', '96h', '120h', '144h', '168h'].includes(durationChoice)) {
            return interaction.reply('Ungültige Dauer. Verwende z.B. 1d für einen Tag, 2h für zwei Stunden usw.');
        }

        const durationInMs = parseDuration(durationChoice);

        await interaction.guild.members.ban(user, { reason });

        const embed = {
            color: 0xff0000,
            title: 'Benutzer temporär gebannt',
            description: `Benutzer ${user.tag} wurde für ${durationString} vom Server gebannt.`,
            fields: [
                { name: 'Grund', value: reason },
            ],
            timestamp: new Date(),
            footer: {
                text: `Server: ${interaction.guild.name}`,
                icon_url: interaction.guild.iconURL({ dynamic: true }) || undefined,
            },
            thumbnail: {
                url: user.displayAvatarURL(),
            },
        };

        const sentMessage = await interaction.reply({ embeds: [embed] });

        setTimeout(async () => {
            await sentMessage.delete();
        }, 20000);

        setTimeout(async () => {
            await interaction.guild.members.unban(user, 'Tempban abgelaufen');
        }, durationInMs);
    } catch (error) {
        console.error('Fehler beim Temporären Bann des Benutzers:', error);
        interaction.reply('Ein Fehler ist aufgetreten. Der Benutzer konnte nicht temporär gebannt werden.');
    }

  } else if (command === 'verlosung') {
    const allowedUsers = ['929435054311096410', '831254329196544091'];
    const allowedRoles = ['Admin', 'Inhaber'];

    if (!allowedUsers.includes(interaction.user.id)) {
        return interaction.reply('Du hast nicht die Berechtigung, diesen Befehl zu verwenden.');
    }

    if (!interaction.member.roles.cache.some(role => allowedRoles.includes(role.name))) {
        return interaction.reply('Du hast nicht die Berechtigung, diesen Befehl zu verwenden.');
    }

    const durationInput = interaction.options.getString('dauer');
    const prize = interaction.options.getString('preis');

    if (!durationInput || !prize) {
        return interaction.reply('Bitte gib die Dauer und den Preis der Verlosung an.');
    }

    const duration = parseVerlosungDuration(durationInput);
    if (duration === null) {
        return interaction.reply('Ungültiges Format für die Dauer. Bitte verwende das Format "<Anzahl><Einheit>". (z.B. 1h für 1 Stunde)');
    }

    const now = new Date();
    const endDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
    endDate.setSeconds(endDate.getSeconds() + duration);

    const formattedEndDate = `${endDate.getDate()}.${endDate.getMonth() + 1}.${endDate.getFullYear()} ${endDate.getHours()}:${endDate.getMinutes()}`;

    try {
        const VerlosungsEmbed = {
            color: 0x00FF00,
            title: 'Verlosung gestartet!',
            description: `**Preis:** ${prize}\n**Ende:** ${formattedEndDate}`,
            timestamp: now,
            footer: {
                text: `${interaction.guild.name}`
            },
            author: {
                name: 'Shop NoviaMc.de',
                url: 'https://shop.noviamc.de'
            },
            thumbnail: {
                url: interaction.guild.iconURL({ dynamic: true }) || undefined,
            },
        };

        const sentMessage = await interaction.channel.send({ embeds: [VerlosungsEmbed] });
        await sentMessage.react('🎉');

        const filter = (reaction, user) => reaction.emoji.name === '🎉' && !user.bot;
        const collector = sentMessage.createReactionCollector({ filter, time: duration });

        collector.on('collect', async (reaction, user) => {
            try {
                const confirmationMessage = `Du nimmst an der Verlosung für **${prize}** teil!`;
                await user.send(confirmationMessage);
            } catch (error) {
                console.error('Fehler beim Senden der Bestätigungsnachricht:', error);
            }
        });

        const participants = [];

        collector.on('collect', (reaction, user) => {
            participants.push(user.id);
        });

        collector.on('end', async (user) => {
            const winnerId = participants[Math.floor(Math.random() * participants.length)];
            const winner = await interaction.guild.members.fetch(winnerId);

            try {
                if (winner) {
                    const winnerMessageEmbed = {
                        color: 0x00FF00,
                        title: '🎉 Verlosungsgewinner 🎉',
                        description: `Herzlichen Glückwunsch an <@${winner.id}>!\nDu bist der Gewinner der Verlosung für **${prize}**! 🥳`,
                    };
                    interaction.channel.send({ embeds: [winnerMessageEmbed] });

                    const privateMessageContent = `🎉 Herzlichen Glückwunsch, du bist der Gewinner der Verlosung für **${prize}**! Um deinen Gewinn zu erhalten, melde dich bitte im Ticket.`;
                    await winner.send(privateMessageContent);
                } else {
                    console.error('Es konnte kein Gewinner ermittelt werden.');
                }
            } catch (error) {
                console.error('Fehler beim Senden der Gewinnerbenachrichtigung:', error);
            }
        });

    } catch (error) {
        console.error('Fehler beim Senden der Nachricht:', error);
    }


  } else if (command === 'mute') {
    const allowedRoles = ['Supporter', 'Supporter+', 'Moderator', 'Moderator+', 'Developer', 'Admin', 'Inhaber'];
    
    if (!interaction.member.roles.cache.some(role => allowedRoles.includes(role.name))) {
        return interaction.reply('Du hast nicht die Berechtigung, diesen Befehl zu verwenden.');
    }

    const userOption = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';

    if (!userOption) {
        return interaction.reply('Bitte gib einen Benutzer an, den du muten möchtest.');
    }

    try {
        const member = await interaction.guild.members.fetch(userOption.id);

        const muteDurationString = interaction.options.getString('duration');
        const muteDuration = parseDuration(muteDurationString);

        if (!muteDuration || muteDuration <= 0) {
            return interaction.reply('Ungültige Mute-Dauer. Bitte verwende das Format "<Anzahl><Einheit>". (z.B. 1h für 1 Stunde)');
        }

        let muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
        if (!muteRole) {
            try {
                muteRole = await interaction.guild.roles.create({
                    name: 'Muted',
                    permissions: [],
                });
                await Promise.all(interaction.guild.channels.cache.map(async channel => {
                    await channel.permissionOverwrites.create(muteRole, {
                        SEND_MESSAGES: false,
                        CONNECT: false
                    });
                }));
            } catch (error) {
                console.error('Fehler beim Erstellen der Mute-Rolle:', error);
                return interaction.reply('Ein Fehler ist aufgetreten. Die Mute-Rolle konnte nicht erstellt werden.');
            }
        }

        await member.roles.add(muteRole);
        interaction.reply(`Benutzer ${member.user.tag} wurde für ${muteDurationString} gemuted.`);

        setTimeout(async () => {
            await member.roles.remove(muteRole);
            interaction.channel.send(`${member.user.tag} wurde entmuted.`);
        }, muteDuration);
    } catch (error) {
        console.error('Fehler beim Mutieren des Benutzers:', error);
        interaction.reply('Ein Fehler ist aufgetreten. Der Benutzer konnte nicht gemuted werden.');
    }
}
});

function parseDuration(durationString) {
  const regex = /(\d+)(h|min|s)/;
  const matches = durationString.match(regex);

  if (!matches) return null;

  const [, amount, unit] = matches;
  const amountInt = parseInt(amount, 10);

  switch (unit) {
      case 'h':
          return amountInt * 60 * 60 * 1000; // Stunden in Millisekunden umrechnen
      case 'min':
          return amountInt * 60 * 1000; // Minuten in Millisekunden umrechnen
      case 's':
          return amountInt * 1000; // Sekunden in Millisekunden umrechnen
      default:
          return null;
  }
}

function parseVerlosungDuration(input) {
  const durationRegex = /^(\d+)\s*(m|h|d)$/i;
  const match = input.match(durationRegex);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
      case 'm':
          return value * 60 * 1000; // Minuten in Millisekunden umrechnen
      case 'h':
          return value * 60 * 60 * 1000; // Stunden in Millisekunden umrechnen
      case 'd':
          return value * 24 * 60 * 60 * 1000; // Tage in Millisekunden umrechnen
      default:
          return null;
  }
}

client.login(token);
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const kanaly = './kanaly.js';

const config = JSON.parse(fs.readFileSync('./config.json'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// nacist kanaly, pokud jsou ulozeny v kanaly.js
let aktivniKanaly = fs.existsSync(kanaly) ? require(kanaly) : [];

// zkontrolovat, jestli je to array
if (!Array.isArray(aktivniKanaly)) {
  aktivniKanaly = [];
  console.log("List aktivních kanálů není array, resetuji.");
}

function ulozitKanaly() {
  fs.writeFileSync(kanaly, JSON.stringify(aktivniKanaly, null, 2));
}

client.once('ready', () => {
  console.log(`Jsem na ${client.guilds.cache.size} serverech, s ${client.users.cache.size} členy`);
});

client.on('messageCreate', async message => {
  if (message.content === '!sendMessage') {
    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('vytvor')
        .setLabel('Vyvotřit kanál')
        .setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.barva || '#ffffff')
      .setDescription(config.popisDesc || '')
      .setFooter({ text: config.popisFooter || '', iconURL: config.ikonkaFooter || null });

    await message.channel.send({
      content: '',
      components: [button],
      embeds: [embed]
    });
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'vytvor') {
    const user = interaction.user;

    // jestli uzivatel ma jiz vytvoreny kanal
    const existujiciKanal = aktivniKanaly.find(c => c.creatorId === user.id);
    if (existujiciKanal) {
    return interaction.reply({
      content: 'Už máš vytvořený kanál, nemůžeš vytvořit nový!',
      flags: 64
    });
    }

    // jestli uzivatel zavrel kanal pred mene jak minutou
    const posledniZavreni = aktivniKanaly.find(c => c.creatorId === user.id)?.lastUserDisconnectTime;
    if (posledniZavreni && Date.now() - posledniZavreni < 60000) {
    return interaction.reply({
      content: 'Po zavření kanálu musíš počkat 1 minutu, než budeš moci vytvořit nový.',
      flags: 64
    });
    }

    const nazevKanalu = `kanal-${user.username}`;

    const novejKanal = await interaction.guild.channels.create({
      name: nazevKanalu,
      type: '2', // guild voice channel
      userLimit: 15,
      reason: 'Vytvoření dočasného kanálu pro uživatele'
    });

    // pro tvurce kanalu
    await novejKanal.permissionOverwrites.create(user.id, {
    [PermissionsBitField.Flags.ViewChannel]: true,
    [PermissionsBitField.Flags.ManageChannels]: true,
    [PermissionsBitField.Flags.ManageMessages]: true,
    [PermissionsBitField.Flags.PrioritySpeaker]: true,
    [PermissionsBitField.Flags.Stream]: true,
    [PermissionsBitField.Flags.SendMessages]: true,
    [PermissionsBitField.Flags.Speak]: true,
    [PermissionsBitField.Flags.Connect]: true
    });

    await interaction.reply({
      content: `Hotovo, tady je: ${novejKanal}`,
      flags: 64
    });

    aktivniKanaly.push({
      channelId: novejKanal.id,
      creatorId: user.id,
      lastUserDisconnectTime: null, // null, protoze nikdo neopustil kanal
      kanalDeletedTime: null // pred vytvorenim kanalu je null
    });
    console.log(`${novejKanal.name} byl vytvoren.`);
    ulozitKanaly();

    const kontrolaKanalu = setInterval(async () => {
      const channel = await interaction.guild.channels.fetch(novejKanal.id);
      const kanalData = aktivniKanaly.find(c => c.channelId === novejKanal.id);

      // nezmaze kanal, pokud je v nem uzivatel
      if (channel.members.size > 0) {
        return;
      }

      if (channel.members.size === 0 && !kanalData.lastUserDisconnectTime) {
        kanalData.lastUserDisconnectTime = Date.now(); // nastavime cas posledniho odpojeni
        ulozitKanaly();
      }

      if (kanalData.lastUserDisconnectTime && Date.now() - kanalData.lastUserDisconnectTime > 10000) {
        clearInterval(kontrolaKanalu);
        await channel.delete();
        kanalData.kanalDeletedTime = Date.now(); // nastaveni casu smazani kanalu
        aktivniKanaly = aktivniKanaly.filter(c => c.channelId !== novejKanal.id);
        ulozitKanaly();
        console.log(`${novejKanal.name} byl smazán.`);
      }
    }, 1000);
  }
});

// sledovani odpojeni uzivatelu
client.on('voiceStateUpdate', (puvodniStav, novyStav) => {
  if (!puvodniStav.channel || !novyStav.channel) return; // pokud uzivatel neopustil nebo nevstoupil do kanalu, pokracujeme dal

  // hledame kanal v seznamu aktivnich kanalu
  const kanalData = aktivniKanaly.find(c => c.channelId === puvodniStav.channel.id);
  if (!kanalData) return; // pokud tam kanal neni, pokracujeme dal

  // pokud uzivatel opustil kanal a kanal je prazdny
  if (puvodniStav.channel.members.size === 0) {
    kanalData.lastUserDisconnectTime = Date.now(); // nastavime cas posledniho odpojeni
    ulozitKanaly();
  }
});

client.login(config.token);

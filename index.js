// index.js (A "Port Hack" verzió, Web Service-hez)
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

// --- ÚJ RÉSZ A WEBSZERVERHEZ ---
const express = require('express');
const app = express();
// A Render.com a PORT változót használja. Ha nincs, 10000-et használunk.
const port = process.env.PORT || 10000;
// --- ÚJ RÉSZ VÉGE ---

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function formatMoney(amount) {
  if (amount === undefined || amount === null) return 'Rejtett';
  return `$${parseInt(amount).toLocaleString('en-US')}`; 
}

// JAVÍTVA: 'ready' helyett 'clientReady'
client.once('clientReady', () => { 
  console.log(`>>> SIKER: A bot bejelentkezve mint ${client.user.tag}! Készen áll a parancsokra.`);
});

client.on('interactionCreate', async (interaction) => {
  // ... (A 'status' és 'playerstats' parancsok kódja itt változatlan marad)
  // ... (Hosszú, ezért nem másolom be újra, de a te kódodban itt kell lennie!)
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  if (commandName === 'status') {
    const API_URL = 'https://api.rockstargames.com/general/v1/status';
    const getStatusEmoji = (msg) => (msg === 'UP' ? '✅' : msg === 'DOWN' ? '❌' : '⚠️');
    try {
      await interaction.deferReply();
      const response = await axios.get(API_URL);
      const embed = new EmbedBuilder().setColor(0xFCB33D).setTitle('Rockstar Games Server Státusz').setTimestamp();
      response.data.status.forEach(service => {
        embed.addFields({ name: service.name, value: `${getStatusEmoji(service.status_message)} **${service.status_message}**`, inline: true });
      });
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply('Hiba történt a szerver státusz lekérése közben.');
    }
  }

  if (commandName === 'playerstats') {
    const username = interaction.options.getString('username');
    console.log(`[INFO] Kérés érkezett a /playerstats parancsra: "${username}"`);
    await interaction.deferReply();
    const apiUrl = `https://sc-cache.com/n/${encodeURIComponent(username)}`;
    try {
      console.log(`[INFO] Kérés küldése ide: ${apiUrl}`);
      const response = await axios.get(apiUrl, { headers: { 'Accept': 'application/json' } });
      const data = response.data;
      console.log(`[INFO] Sikeres válasz érkezett: ${data.name}`);
      const embed = new EmbedBuilder().setColor(0x528BDE).setTitle(`🎮 Játékos Statisztikák: ${data.name}`).setThumbnail(data.avatar).setURL(`https://sc-cache.com/n/${data.name}`).addFields({ name: 'Név', value: `**${data.name}**`, inline: true }, { name: 'Rockstar ID', value: `\`${data.rid}\``, inline: true }).setFooter({ text: 'Adatok forrása: sc-cache.com' }).setTimestamp();
      if (data.gta5 && data.gta5.rank) {
        const gtaStats = data.gta5;
        embed.addFields({ name: '\u200B', value: '**--- GTA Online Statisztikák ---**' }, { name: 'Szint (Rank)', value: gtaStats.rank.toString(), inline: true }, { name: 'Játékidő', value: gtaStats.playtime || 'N/A', inline: true }, { name: 'K/D Arány', value: gtaStats.kd || 'N/A', inline: true }, { name: 'Készpénz', value: formatMoney(gtaStats.cash), inline: true }, { name: 'Bank', value: formatMoney(gtaStats.bank), inline: true }, { name: 'Crew', value: gtaStats.crew || 'Nincs', inline: true });
      } else {
        embed.addFields({ name: 'GTA Online', value: 'Nincsenek publikus adatok.', inline: false });
      }
      if (data.rdr2 && data.rdr2.rank) {
        const rdrStats = data.rdr2;
        embed.addFields({ name: '\u200B', value: '**--- Red Dead Online Statisztikák ---**' }, { name: 'Szint (Rank)', value: rdrStats.rank.toString(), inline: true }, { name: 'Játékidő', value: rdrStats.playtime || 'N/A', inline: true });
      } else {
        embed.addFields({ name: 'Red Dead Online', value: 'Nincsenek publikus adatok.', inline: false });
      }
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`[HIBA] Az API 404-et adott vissza. Játékos nem található: "${username}"`);
        await interaction.editReply(`❌ Nem található játékos ezzel a névvel: "${username}"`);
      } else {
        console.error('>>> SÚLYOS HIBA a /playerstats parancsnál:', error.message);
        await interaction.editReply('Hiba történt a statisztikák lekérése közben. Ellenőrizd a konzolt!');
      }
    }
  }
});

// A Discord bot bejelentkeztetése
client.login(process.env.DISCORD_TOKEN);

// --- ÚJ RÉSZ: A DUMMY WEBSZERVER ELINDÍTÁSA ---
// Ez fogja nyitva tartani a portot, hogy a Render Web Service elégedett legyen
app.get('/', (req, res) => {
  res.send('A bot fut, és a port nyitva van. (Ez az üzenet az UptimeRobotnak szól.)');
});

app.listen(port, () => {
  console.log(`[INFO] A dummy webszerver elindult a ${port} porton.`);
});

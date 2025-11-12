// deploy-commands.js (Frissítve, .env-t használ)
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config(); // Ez betölti a .env fájlt!

// Beolvassuk az új változókat a .env-ből
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// Ellenőrizzük, hogy minden megvan-e
if (!token || !clientId || !guildId) {
  console.error('>>> HIBA: A DISCORD_TOKEN, CLIENT_ID vagy GUILD_ID hiányzik a .env fájlból!');
  process.exit(1); // Kilépés hibával
}

const commands = [
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Rockstar Games szerverek státuszának ellenőrzése')
    .toJSON(),
  
  new SlashCommandBuilder()
    .setName('playerstats')
    .setDescription('Egy Rockstar játékos részletes statisztikáinak lekérése (Szint, Pénz, K/D)')
    .addStringOption(option => 
      option.setName('username')
        .setDescription('A játékos Social Club neve')
        .setRequired(true)
    )
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Slash parancs(ok) frissítése...');
    await rest.put(
      // Itt már az .env-ből olvasott változókat használjuk
      Routes.applicationGuildCommands(clientId, guildId), 
      { body: commands },
    );
    console.log('>>> SIKER: A parancsok (status, playerstats) regisztrálva!');
  } catch (error) {
    console.error('>>> HIBA a deploy-commands.js futtatása közben:', error);
  }
})();

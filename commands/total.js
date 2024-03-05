const { SlashCommandBuilder } = require('discord.js');
//データ操作ライブラリ
const fnc_users = require('../users.cjs');
const fnc_studytimer = require('../studytimer.cjs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('total')
		.setDescription('あなたの総勉強時間を表示します'),
	execute: async function(interaction) {
        const user = await fnc_users.getUserInfo(interaction.user.id);
        if(!user){
           await interaction.reply('まだ勉強時間が記録されていません。自習室に参加してください。')
           return ;
        }
        const totalHourOfStudy = await user.totalHourOfStudy;
        const strTotalHourOfStudy = fnc_studytimer.formatTime(totalHourOfStudy);
      
		await interaction.reply(`あなたの勉強時間は${strTotalHourOfStudy}です！`);
	},
};
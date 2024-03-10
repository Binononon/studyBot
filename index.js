// 各スラッシュコマンド用モジュールのmodule.exportsを呼び出します。
const heyFile = require('./commands/hey.js');
const cmdTotal = require('./commands/total.js');

// discord.jsライブラリの中から必要な設定を呼び出し、変数に保存します
const { Client, Events, GatewayIntentBits } = require('discord.js');

//データ操作モジュール
const fnc_users = require('./modules/users.cjs');
const fnc_studytimer = require('./modules/studytimer.cjs');


// 設定ファイルから特定の情報を呼び出し、変数に保存します
const { token, sendMsgChannelID } = require('./config.json');

// クライアントインスタンスと呼ばれるオブジェクトを作成します
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
    ] 
});

// クライアントオブジェクトが準備OKとなったとき一度だけ実行されます
client.once(Events.ClientReady, c => {
	console.log(`準備OKです! ${c.user.tag}がログインします。`);
});

//スラッシュコマンドに応答するには、interactionCreateのイベントリスナーを使う必要があります
client.on(Events.InteractionCreate, async interaction => {

    // スラッシュ以外のコマンドの場合は対象外なので早期リターンさせて終了します
    // コマンドにスラッシュが使われているかどうかはisChatInputCommand()で判断しています
    if (!interaction.isChatInputCommand()) return;

    // heyコマンドに対する処理
    switch (interaction.commandName) {
        case heyFile.data.name:
            try {
                await heyFile.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'コマンド実行時にエラーになりました。', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'コマンド実行時にエラーになりました。', ephemeral: true });
                }
            }
            break;
        case cmdTotal.data.name:
                try {
                    console.log(interaction.user.id);
                    await cmdTotal.execute(interaction);
                } catch (error) {
                    console.error(error);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'コマンド実行時にエラーになりました。', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'コマンド実行時にエラーになりました。', ephemeral: true });
                    }
                }
                break;
        default:
            console.error(`${interaction.commandName}というコマンドには対応していません。`);
    }
});

//スラッシュコマンド以外のイベントハンドラ
//VC関連
client.on("voiceStateUpdate", async (oldState, newState) => {
    if(newState && oldState) {
        if(oldState.channelId === newState.channelId) {
            //ここはミュートなどの動作を行ったときに発火する場
            console.log(`other`);
        }

        if(oldState.channelId === null && newState.channelId != null) {
            //ここはconnectしたときに発火する場所
            console.log(`${newState.member.displayName}さんが入室しました`);
            fnc_studytimer.timerStart(newState.id);
        }

        if(oldState.channelId != null && newState.channelId === null) {
            //ここはdisconnectしたときに発火する場所
            console.log(`${newState.member.displayName}さんが退室しました`);
  
            //タイマーの計測を終了し、退出したユーザーのタイマー情報を取得 
            const timer = await fnc_studytimer.timerEnd(newState.id);
            const hourOfStudy = await timer.time_end - timer.time_start;

            //勉強時間をusersテーブルに登録し、総勉強時間を取得するためユーザー情報を取得する
            const user = await fnc_users.upSertUserData(newState.id, hourOfStudy);
            const totalHourOfStudy = user.totalHourOfStudy;
            //勉強時間報告用テキストチャンネルへ勉強時間を送信する。
            
            const strHourOfStudy =  fnc_studytimer.formatTime(hourOfStudy);
            const strTotalHourOfStudy = fnc_studytimer.formatTime(totalHourOfStudy);
            client.channels.cache.get(sendMsgChannelID).send(`${newState.member.displayName}さんの勉強時間は${strHourOfStudy}でした`);
            client.channels.cache.get(sendMsgChannelID).send(`今まで総勉強時間は${strTotalHourOfStudy}です`);

        }        
    }
});

// ログインします
client.login(token);
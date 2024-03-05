/**
 * 勉強時間記録用テーブル(studytimer)を処理を記述するCJSモジュールです。
 * ライブラリはkeyvを使用します。
 */

//データ保存用ライブラリ
const Keyv = require('keyv');

//_studytimerテーブル参照用定数
const _studytimer = new Keyv('sqlite://test.db', { table: 'studytimer' } );

_studytimer.on("error", (err) => console.log("Connection Error", err));

exports.getTimerInfo = (argUserId) => {
    return _studytimer.get(argUserId,true);
}

/**
 * studytimerテーブルにユーザーID毎にtime_startへ現在時刻をセットします。VCに入室した際にindex.jsから呼び出される想定。
 * @param {string} argUserId
 */
exports.timerStart = (argUserId) => {
    _studytimer.set(argUserId, { "userID": argUserId, "time_start": Date.now(), "time_end": null });
}

/**
 * studytimerテーブルにユーザーID毎にtime_endへ現在時刻をセットします。VCに退室した際にindex.jsから呼び出される想定。
 * @param {string} argUserId
 */
exports.timerEnd = async (argUserId) => {
    const timer  = await this.getTimerInfo(argUserId);
    //ないとは思うが、タイマーのデータが取得できなければ何かしらの異常動作と捉え終了させる
    if(!timer) return;

    timer.time_end = Date.now();
    _studytimer.set(argUserId, timer, 10000);
}

/**
 * Date.now()などで取得したミリ秒のnumberを「~分~秒」という文字列に変換して返します。
 * @param {number} argDateNum ミリ秒の数値
 * @returns {string} 文字列「ー分ー秒」
 */
exports.formatTime = (argDateNum) => {
    const hours = Math.floor(argDateNum/1000/60/60)%24
    const min = Math.floor(argDateNum/1000/60)%60;

    const retTime = `${hours}時間 ${min}分`
    return retTime;
}
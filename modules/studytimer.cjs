/**
 * 勉強時間記録用テーブル(studytimer)を処理を記述するCJSモジュールです。
 * ライブラリはkeyvを使用します。
 */

//データ保存用ライブラリ
const Keyv = require('keyv');

//studytimerテーブル参照用定数
const _studytimer = new Keyv('sqlite://study.db', { table: 'studytimer' } );

_studytimer.on("error", (err) => console.log("Connection Error", err));

/**
 * studytimerのテーブル構成を設定します
 * @param {*} argUserId ユーザーID
 */
const init = async (argUserId) => {
    const tblStudyTimer = {
        "userID": argUserId,         //ユーザーID
        "time_start": Date.now(),    //計測開始時間
        "time_end": 0                //計測終了時間
    }
    await _studytimer.set(argUserId, tblStudyTimer);
}


exports.getTimerInfo = (argUserId) => {
    return _studytimer.get(argUserId);
}

/**
 * studytimerテーブルにユーザーID毎にtime_startへ現在時刻をセットします。VCに入室した際にindex.jsから呼び出される想定。
 * @param {string} argUserId
 */
exports.timerStart = (argUserId) => {
    init(argUserId);
}

/**
 * studytimerテーブルにユーザーID毎にtime_endへ現在時刻をセットします。VCに退室した際にindex.jsから呼び出される想定。
 * @param {string} argUserId
 */
exports.timerEnd = async (argUserId) => {
    const timer = await this.getTimerInfo(argUserId);
    //studytimerテーブルオブジェクトをコピー
    const updtimer = await Object.assign({}, timer);
    updtimer.time_end = Date.now();
    //更新内容をマージ
    const result = await Object.assign(timer, updtimer);
    //終了時間を登録
    await _studytimer.set(argUserId, result, 60000);
    
    return timer;
}

/**
 * studytimerに記録されたデータから勉強時間を計算して返します。
 * @param {*} timer studytimerテーブルのvalueオブジェクト
 * @returns 勉強時間（ミリ秒）
 */
exports.calcHourofStudy = async (timer) => {
    return timer.time_end - timer.time_start;
}

/**
 * Date.now()などで取得したミリ秒のnumberを「~分~秒」という文字列に変換して返します。
 * @param {number} argDateNum ミリ秒の数値
 * @returns 文字列「ー分ー秒」
 */
exports.formatTime = (argDateNum) => {
    const hours = Math.floor(argDateNum/1000/60/60)%24
    const min = Math.floor(argDateNum/1000/60)%60;

    const retTime = `${hours}時間 ${min}分`
    return retTime;
}
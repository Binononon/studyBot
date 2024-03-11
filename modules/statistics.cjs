/**
 * 勉強時間統計テーブル(statistics)を処理を記述するCJSモジュールです。
 * ライブラリはkeyvを使用します。
 */

//データ保存用ライブラリ
const Keyv = require('keyv');

//データ操作モジュール
const fnc_users = require('./users.cjs');

//statisticsテーブル参照用定数
const _statistics = new Keyv('sqlite://study.db', { table: 'statistics' } );

_statistics.on("error", (err) => console.log("Connection Error", err));

/**
 * statisticsのテーブル構成を設定します
 * @param {*} argUserId ユーザーID
 * @returns statisticsのvalue(テーブル)オブジェクト
 */
const init = async (argUserId) => {
    const tblStatistics = {
        "userID": argUserId,    //ユーザーID
        "perDay": 0,            //1日ごとの勉強時間
        "perWeek": 0,           //１週間ごとの勉強時間
        "perMonth": 0,          //ひと月ごとの勉強時間
    }
    await _statistics.set(argUserId, tblStatistics, 86400000 * 31);
    return _statistics.get(argUserId);
    
}


/**
 * ユーザーIDを元にstatisticsテーブルからユーザー情報を取得します。
 * @param {string} argUserId ユーザーID 
 * @returns statisticsテーブルのvalueオブジェクト。引数のユーザーIDをキーとするデータが存在しない場合はundefinedを返します
 */
exports.getStatistics =  async (argUserId) => {
    //argUserIdをキーに_statisticsテーブルからユーザー情報を取得
    const statistics = _statistics.get(argUserId);
    return statistics;
}

/**
 * ユーザーの勉強時間の統計情報をstatisticsテーブルにアップサートします。
 * ユーザーIDがテーブルに存在しなければ新規でデータを作成します。
 * @param {string} argUser usersテーブルのvalueオブジェクト
 * @param {number} argHourOfStudy 勉強時間。当引数にわたってきた値をVCの滞在時間として勉強時間に加算します。
 * @returns statisticsテーブルのvalueオブジェクト。
 */
exports.upsertStatistics = async (argUser, argHourOfStudy) => {

    //ユーザーの統計データを取得　※取得できなければ新たにstatisticsのテーブルを生成する
    const statistics = await this.getStatistics(argUser.userID) ?? await init(argUser.userID); 
    //取得したuserテーブルオブジェクトをコピー
    const updStatistics = await Object.assign({}, statistics);

    //↓userの更新時間に応じて、各統計フィールドに時間を登録（加算）していく。
    const sysDate = fnc_users.getDate();  //今日日付を取得

    //今日の日付 = users.更新日付の場合、一日毎の勉強時間を加算する（そうでなければ新たに登録）
    updStatistics.perDay = sysDate == argUser.updDate ?  updStatistics.perDay + argHourOfStudy : argHourOfStudy;

    // //今週の始まり <= users.更新日付 <= 今週の終わり
    // statistics.perWeek = 今週の始まり <= users.更新日付 <= 今週の終わり ?  perWeek + argHourOfStudy : argHourOfStudy

    // //今日の月 = users.更新日付の月
    // statistics.perMonth = Date.Now() = users.updDate ?  perMonth + argHourOfStudy : argHourOfStudy

    //更新内容をマージ
    const result = Object.assign(statistics, updStatistics);
    //更新後のデータを登録
    await _statistics.set(argUser.userID, result);

    return statistics;
}

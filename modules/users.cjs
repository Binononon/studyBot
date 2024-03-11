/**
 * ユーザーテーブル(users)を処理を記述するCJSモジュールです。
 * ライブラリはkeyvを使用します。
 */

//データ保存用ライブラリ
const Keyv = require('keyv');
//userテーブル参照用定数
const _users = new Keyv('sqlite://study.db', { table: 'users' } );

_users.on("error", (err) => console.log("Connection Error", err));

//データ保持期間（二週間）※configで読み込むようにしてもいいかも
const _expireTime = 86400000 * 14;



/**
 * userのテーブル構成を設定します
 * @param {*} argUserId ユーザーID
 * @returns userのvalue(テーブル)オブジェクト
 */
const init = async (argUserId) => {
    const tblUser = {
        "userID": argUserId,             //ユーザーID
        "totalHourOfStudy": null,        //総勉強時間
        "updDate": this.getDate()        //更新日付 
    }
    await _users.set(argUserId, tblUser);
    return _users.get(argUserId);
}

/**
 * 今日日付を取得します。 
 * @returns YYYY-MM-DD形式の日付文字列
 */
exports.getDate = () => {
    //sv-SEロケールはYYYY-MM-DD形式の日付文字列を返します。
    return new Date().toLocaleDateString('sv-SE');
}


/**
 * ユーザーIDを元にusersテーブルからユーザー情報を取得します。
 * @param {string} argUserId ユーザーID 
 * @returns userオブジェクト。引数のユーザーIDをキーとするデータが存在しない場合はundefinedを返します。
 */
exports.getUserInfo =  async (argUserId) => {
    //argUserIdをキーにusersテーブルからユーザー情報を取得
    const user = _users.get(argUserId);
    return user;
}


/**
 * ユーザーの情報をusersテーブルにアップサートします。
 * ユーザーIDがテーブルに存在しなければ新規でデータを作成します。
 * 2週間更新されなかった場合、そのデータは削除されます。
 * @param {string} argUserId ユーザーID
 * @param {number} argHourOfStudy 勉強時間。当引数にわたってきた値をVCの滞在時間として勉強時間に加算します。
 */
exports.upSertUserData = async (argUserId, argHourOfStudy) => {
    const user =  await this.getUserInfo(argUserId) ?? await init(argUserId);
    //取得したuserテーブルオブジェクトをコピー
    const updUser = await Object.assign({}, user);
    //総勉強時間に引数の勉強時間を加算して、更新を行う
    const totalHourOfStudy = updUser.totalHourOfStudy + argHourOfStudy;
    updUser.totalHourOfStudy =  totalHourOfStudy;
    updUser.updDate = this.getDate();
    //更新内容をマージ
    const result = await Object.assign(user, updUser);
    //更新したデータを保存する
    await _users.set(argUserId, result, _expireTime);
    return user;
}

/**
 * ユーザーテーブル(users)を処理を記述するCJSモジュールです。
 * ライブラリはkeyvを使用します。
 */

//データ保存用ライブラリ
const Keyv = require('keyv');
//userテーブル参照用定数
const _users = new Keyv('sqlite://test.db', { table: 'users' } );

_users.on("error", (err) => console.log("Connection Error", err));

//データ保持期間（二週間）※configで読み込むようにしてもいいかも
const _expireTime = 86400000 * 14;


/**
 * ユーザーIDを元に_usersテーブルからユーザー情報を取得します。
 * @param {string} argUserId ユーザーID 
 * @returns userオブジェクト。引数のユーザーIDをキーとするデータが存在しない場合はundefinedを返します。
 */
exports.getUserInfo =  (argUserId) => {
    //argUserIdをキーに_usersテーブルからユーザー情報を取得
    const user = _users.get(argUserId);
    return user;
}


/**
 * ユーザーの情報を_usersテーブルにアップサートします。
 * ユーザーIDがテーブルに存在しなければ新規でデータを作成します。
 * 2週間更新されなかった場合、そのデータは削除されます。
 * @param {string} argUserId ユーザーID
 * @param {number} argHourOfStudy 勉強時間。当引数にわたってきた値をVCの滞在時間として勉強時間に加算します。
 */
exports.upSertUserData = async (argUserId, argHourOfStudy) => {
    const user = await this.getUserInfo(argUserId);

    if(!user) {
        //ユーザーが_usersテーブルに存在しない場合は、_usersテーブルに新規登録する
        console.log(`${argUserId}は未登録ユーザーです。新規登録を行います。`);
        await _users.set(argUserId, { "userID": argUserId, "totalHourOfStudy": argHourOfStudy }, _expireTime);
    } else {
        //登録済みユーザーは保存されている総勉強時間に引数の勉強時間を加算して、更新を行う
        let totalHourOfStudy = await user.totalHourOfStudy + argHourOfStudy;
        user.totalHourOfStudy = await totalHourOfStudy;
        await _users.set(argUserId, user, _expireTime);
    }
}

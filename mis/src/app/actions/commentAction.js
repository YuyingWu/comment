import AV from "leancloud-storage";
var APP_ID = 'wPyQjUmvJiSYs1ovT7uGsNE0-gzGzoHsz';
var APP_KEY = 'j182JIXghHrneWAiBDaqmuhR';

AV.init({
  appId: APP_ID,
  appKey: APP_KEY
});

const DATABASE_NAME = 'Comment';
const ID = '1';

const formatData = results => {
    let tmp = [];

    if(!results.length){
        results = [results];
    }

    results.map(item => {
        let { id, createdAt } = item;
        let obj = {
            id,
            createdAt,
            ...item.attributes
        };

        tmp.push(obj);
    });

    return tmp;
}

export function initList(data) {
    // return dispatch => {
    //     setTimeout(() => {
    //         dispatch({
    //             type: "SET_NAME",
    //             payload: name
    //         });
    //     }, 2000);
    // }
    var query = new AV.Query(DATABASE_NAME);

    query.equalTo('permalink', ID);
    query.descending('createdAt');

    return {
        type: "INIT_LIST",
        payload: query.find().then(results => {
            return formatData(results);
        }, function (error) {
            return error;
        })
    };
}

export function selectComment(data) {
    return {
        type: "SELECT_COMMENT",
        payload: data
    };
}

export function updateDisplayList(data) {
    return {
        type: "UPDATE_DISPLAY",
        payload: data
    };
}

export function delComment(id) {
    var comment = AV.Object.createWithoutData(DATABASE_NAME, id);

    return {
        type: "DEL_COMMENT",
        payload: comment.destroy().then(function (success) {
            // 删除成功
            return id;
        }, function (error) {
            // 删除失败
            return error;
        })
    };
}

export function updateComment(id, key, value) {
    var comment = AV.Object.createWithoutData(DATABASE_NAME, id);
console.log(key, value);
    comment.set(key, value);

    return {
        type: "UPDATE_COMMENT",
        payload: comment.save().then(function (data) {
            // 成功
            return {
                id,
                key,
                value
            };
        }, function (error) {
            // 失败
            return error;
        })
    };
}
var direct={};
var inverse={};

module.exports.set=function(user_id,user_ids) {
    //console.log('rel set for '+user_id);
    //console.log(user_ids);

    if (direct[user_id]) {
        var related=direct[user_id];
        for(var i in related) {
            inverse[related[i]].splice(inverse[related[i]].indexOf(user_id),1);
            if (inverse[related[i]].length==0) delete inverse[related[i]];
        }
        delete direct[user_id];
    }

    direct[user_id]=user_ids;
    for(i in user_ids) {
        if (!inverse[user_ids[i]]) {
            inverse[user_ids[i]]=[user_id];
        } else {
            inverse[user_ids[i]].push(user_id);
        }
    }
}

module.exports.getInverse=function(user_id) {
    //console.log('get inverse for '+user_id);
    //console.log(inverse[user_id] ? inverse[user_id]:[]);

    return inverse[user_id] ? inverse[user_id]:[];
}

module.exports.getDirect=function(user_id) {
    return direct[user_id] ? direct[user_id]:[];
}

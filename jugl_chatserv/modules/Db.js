var mysql = require('mysql');
var Q=require('q');

global.dbErrorHandler=function(err) {
    if (err) throw err;
}

global.db = mysql.createPool(config.db);

global.dbQuery=function(query, params) {
    return Q.Promise(function (resolve, reject, notify) {
        params = params || {};
        db.query(query, params, function (error, rows, fields) {
            if (error) {
                logger.error(error+' full SQL query: "'+query+'"');
                reject(error);
            }

            resolve(rows);
        });
    });
}


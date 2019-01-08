var winston = require('winston');

var transports=[];

if (global.config.logger.logToConsole) {
    transports.push(new (winston.transports.Console)({
        timestamp:true
    }));
}

if (global.config.logger.logToFile) {
    transports.push(new (winston.transports.DailyRotateFile)({
            timestamp:true,
            filename:'logs/log',
            level: 'error',
            json:true
    }));
}

global.logger = new (winston.Logger)({transports: transports});

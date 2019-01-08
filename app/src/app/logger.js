function RCInit(apiEndpoint,deviceId,loggingLevel) {
    var loggingLevels={
        'DEBUG':1,
        'INFO':2,
        'LOG':3,
        'WARN':4,
        'ERROR':5
    };
    
    if (!loggingLevel || !loggingLevels[loggingLevel]) {
        loggingLevel='DEBUG';
    }
    
    var SENDING_TIMEOUT=30*1000;
    var PAUSE_AFTER_SENT_SUCCESS=10*1000;
    var PAUSE_AFTER_SENT_FAIL=30000;
    var CONSOLE_TIMESTAMPING=true;
    var RC_DEBUG=false;

    var unsentLog=[];
    var sendingLog=[];
    var isSendingLog=false;

    var sessionId=deviceId+'-'+Math.floor(Math.random()*900000+100000);

    var oConsole=window.console;

    function tryToSendLog() {
        if (RC_DEBUG) oConsole.log('RC try to send log');
        if (unsentLog.length===0 || isSendingLog) return;
        if (RC_DEBUG) oConsole.log('RC sending log');

        isSendingLog=true;
        sendingLog=unsentLog;
        unsentLog=[];

        function sendingFailed() {
            if (RC_DEBUG) oConsole.log('RC sending failed');
            unsentLog=sendingLog.concat(unsentLog);
            sendingLog=[];
            setTimeout(function() {
                isSendingLog=false;
                tryToSendLog();
            },PAUSE_AFTER_SENT_FAIL);
        }

        $.ajax({
            type:'POST',
            url:apiEndpoint,
            data: JSON.stringify({
                sessionId:sessionId,
                log:sendingLog
            }),
            contentType: 'application/json; charset=utf-8',
            dataType:'json',
            timeout: SENDING_TIMEOUT
        }).done(function(data){
            if (RC_DEBUG) oConsole.log('RC got response');
            if (data.result=='OK') {
                if (RC_DEBUG) oConsole.log('RC sent successfully');
                sendingLog=[];
                setTimeout(function() {
                    isSendingLog=false;
                    tryToSendLog();
                },PAUSE_AFTER_SENT_SUCCESS);
            } else {
                sendingFailed();
            }
            tryToSendLog();
        }).fail(function(){
            if (RC_DEBUG) oConsole.log('RC got bad response');
            sendingFailed();
        });
    }

    function log(type,args) {
        if (loggingLevels[loggingLevel]<=loggingLevels[type]) 
        unsentLog.push({
            dt: (new Date()).getTime(),
            type: type,
            args: args
        });

        tryToSendLog();
    }

    function consoleTimestamping(oConsole, args) {
        if (!CONSOLE_TIMESTAMPING) return args;
        if (args[0] !== null && typeof args[0] === 'object') return args;

        args=Object.create(args);
        args[0]=(new Date()).toISOString()+' '+args[0];

        return args;
    }

    window.addLogEntry=function () {
        carguments=consoleTimestamping(oConsole, arguments);
        log('LOG',arguments);
    };

    if (!isWp()) {
        window.console = {
            log: function () {
                carguments = consoleTimestamping(oConsole, arguments);
                oConsole.log.apply(oConsole, carguments);
                log('LOG', arguments);
            },
            debug: function () {
                carguments = consoleTimestamping(oConsole, arguments);
                oConsole.debug.apply(oConsole, carguments);
                log('DEBUG', arguments);
            },
            info: function () {
                carguments = consoleTimestamping(oConsole, arguments);
                oConsole.info.apply(oConsole, carguments);
                log('INFO', arguments);
            },
            warn: function () {
                carguments = consoleTimestamping(oConsole, arguments);
                oConsole.warn.apply(oConsole, carguments);
                log('WARN', arguments);
            },
            error: function () {
                carguments = consoleTimestamping(oConsole, arguments);
                oConsole.error.apply(oConsole, carguments);
                log('ERROR', arguments);
            },
            profile: oConsole.profile,
            profileEnd: oConsole.profileEnd
        };

        window.onerror =function (errorMsg, url, lineNumber, colno, error) {
            if (error && error.stack) {
                log('ERROR',error.stack);
            } else {
                log('ERROR', errorMsg + ' in ' + url + ' at line ' + lineNumber);
            }
            return false;
        };
    }

    oConsole.log('RC started for session '+sessionId+', remote url: '+apiEndpoint);
}

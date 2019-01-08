require("./base.js");

var os = require("os");

var selector = os.hostname()+__filename;

switch (selector) {
    case 'webserver1404/var/www/jugl_chatserv/config/config.js':
        require('./dev.js');
        break;
    //case 'h2398871.stratoserver.net':
    //case 'server.jugl.net':
    case 'server/var/www/jugl_chatserv/jugl_chatserv/config/config.js':
        require('./prod.js');
        break;
    case 'server.jugl.net/var/www/jugl_chatserv_test/jugl_chatserv/config/config.js':
        require('./test.js');
        break;
    default:
        console.log('unknown hostname "'+selector+'"');
        process.exit(1);
}
global.config.db = {
        socketPath: '/var/run/mysqld/mysqld.sock',
        user: 'jugl_test',
        password: 'jugl_test',
        database: 'jugl_test',
        charset: 'UTF8_GENERAL_CI'
};

global.config.logger = {
        logToConsole: true,
        logToFile: false
};

global.config.siteDomain='jugl.loc22';
global.config.scheme='http://';

global.config.avatarPlaceholderUrl=global.config.scheme+global.config.siteDomain+'/static/images/account/default_avatar.png';
global.config.avatarFileUrl=global.config.scheme+global.config.siteDomain+'/thumbs';
global.config.chatFileUrl=global.config.scheme+global.config.siteDomain;
global.config.chatFileThumbUrl=global.config.scheme+global.config.siteDomain+'/thumbs';

global.config.chatFileIdProtectionCode='06G6eB6xI5M%0a08Y1694eU5055DB7jW';

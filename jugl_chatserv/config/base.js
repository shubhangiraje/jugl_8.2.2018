global.config={
    publicServer: {
        port: 3000
    },
    rpcServer: {
        port: 8080,
        allowIPs: /127\.0\.0\.1/,
        maxBodySize: 16*1024
    },
    authorization: {
        secret: 'WXeHj7YqgMh7t28aQ9smEGFZZkk4FSt6s5nQxUrm5XaMgvcj'
    },
    mobileMessageDeliveryTimeout: 15000,
    googlePushService: {
        key: 'AIzaSyBvl3JxTFpQB-G204RsoGiGEqHy0_PRb7o'
    },
    applePushService: {
        production: false,
        cert: 'config/apple-push-sandbox.pem',
        key: 'config/apple-push-sandbox.key'
    }
};



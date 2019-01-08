## app build instructions

1. Install fresh debian 9 system. If user with login 'user' not created, please create it
2. Test install uses domain jugl.loc22, so you must point this domain to server IP in your hosts file (/etc/hosts in linux)

3. Install software:

```
apt install mc htop  
```

4. copy app folder from archive to /home/user/

5. Install docker & docker-compose 

Install Docker CE by manual https://docs.docker.com/install/linux/docker-ce/debian/#install-docker-ce

execute under root:
```
apt install -y \
     apt-transport-https \
     ca-certificates \
     curl \
     gnupg2 \
     software-properties-common
     
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -

add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/debian \
   $(lsb_release -cs) \
   stable"
   
apt update

apt install -y docker-ce

```
       
Install docker-compose by manual https://github.com/docker/compose/releases

run under root:       
```       
curl -L https://github.com/docker/compose/releases/download/1.22.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

6. Add user 'user' to docker group

run under root:
```
usermod -a -G docker user
reboot
```


6. run docker container for building app:

```
cd /home/user/app 
docker/up-dev
```

If all goes ok, in end you should see output:

```
cordova_1  | [07:52:49] Using gulpfile ~/src/gulpfile.js
cordova_1  | [07:52:49] Starting 'po'...
cordova_1  | [07:52:49] Starting 'kendoui-css'...
cordova_1  | [07:52:49] Starting 'jslibs'...
cordova_1  | [07:52:49] Starting 'smiles'...
cordova_1  | [07:52:49] Starting 'css'...
cordova_1  | [07:52:49] Starting 'html'...
cordova_1  | [07:52:49] Starting 'appjs'...
cordova_1  | [07:52:49] Starting 'appjsmin'...
cordova_1  | [07:52:49] Starting 'img'...
cordova_1  | [07:52:49] Starting 'fonts'...
cordova_1  | [07:52:49] Starting 'sound'...
cordova_1  | [07:52:49] Starting 'i18n'...
cordova_1  | [07:52:52] Finished 'i18n' after 2.22 s
cordova_1  | [07:52:52] Finished 'css' after 2.5 s
cordova_1  | [07:52:52] Finished 'sound' after 2.33 s
cordova_1  | [07:52:52] Finished 'po' after 3.25 s
cordova_1  | [07:52:52] Finished 'kendoui-css' after 2.93 s
cordova_1  | [07:52:52] Finished 'fonts' after 2.5 s
cordova_1  |    create ../www/img/sprite-smiles.png
cordova_1  |     write /var/www/jugl_app/www/css/smiles.css
cordova_1  | 
cordova_1  | [07:53:23] Finished 'smiles' after 34 s
cordova_1  | [07:53:23] Finished 'jslibs' after 34 s
cordova_1  | [07:53:24] Finished 'img' after 35 s
cordova_1  | [07:53:24] Finished 'html' after 35 s
cordova_1  | [07:53:29] Finished 'appjsmin' after 40 s
cordova_1  | [07:53:29] Finished 'appjs' after 40 s
cordova_1  | [07:53:29] Starting 'deploy'...
cordova_1  | [07:53:29] Finished 'deploy' after 87 μs
cordova_1  | [07:53:29] Starting 'watch'...
cordova_1  | [07:53:30] Finished 'watch' after 417 ms
```

This means that container started correctly, and html&js&css application sources was build successfully and placed in app/www folder.
You can even copy contents of app/www folder to any webserver and test almost all application functionality from webbrowser (we recommend chrome&chromium)

Open second console, and run following commands to configure build process:

```
docker exec -ti jugl_app_cordova_1 /bin/sh
/opt/android/tools/bin/sdkmanager --update
```

answer 'Y' on question

```
chmod -R 777 /opt/android
exit
```

```
cd /home/user/app
docker/cordova-cli
cordova platform add android
cordova plugin add src/plugins/cordova-imagePicker
cordova plugin add src/plugins/VideoCapturePlus-PhoneGap-Plugin
cordova plugin add https://github.com/nchutchind/cordova-plugin-streaming-media.git
```

To build android apk, do following steps:

open container console to run cordova commands:

```
cd /home/user/app
docker/cordova-cli
```

build apk:

```
cordova build android
```

In case of successfull build apk will be placed in /home/user/app/platforms/android/build/outputs/apk/debug
    


## Test server installation instructions

1. Install fresh debian 9 system. If user with login 'user' not created, please create it
2. Test install uses domain jugl.loc22, so you must point this domain to server IP in your hosts file (/etc/hosts in linux)

3. Install software:

apt install mc htop nginx-full php7.0-fpm php7.0-gd php7.0-json php7.0-mbstring  php7.0-mcrypt  php7.0-mysql  php7.0-opcache php7.0-readline php7.0-xml php7.0-curl mysql-server curl git ffmpeg 

4. Copy config files from rootfs subfolder of this folder to your server

5. Reboot server

6. run "mysql" command and execute following sql commands to create user and database
CREATE USER 'jugl_test'@'localhost' IDENTIFIED BY  'jugl_test';
CREATE DATABASE IF NOT EXISTS  jugl_test;
GRANT ALL PRIVILEGES ON  jugl_test.* TO 'jugl_test'@'localhost';
FLUSH PRIVILEGES;

7. restore jugl_test database from sql dump

8. Install nodejs:

curl -sL https://deb.nodesource.com/setup_8.x | bash -
sudo apt-get install -y nodejs

9. Install gulp and bower:

npm install -g gulp bower

10. Install composer:

php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer

11. copy htdocs repo folder contents to folder /var/www/jugl

12. in file /var/www/jugl/config/site_dev.php after string '$config=\yii\helpers\ArrayHelper::merge($config, [' add following piece of code:

    'aliases' => [
        '@bower' => '@vendor/bower-asset',
        '@npm'   => '@vendor/npm-asset',
    ],

13. in file /var/www/jugl/config/dev.php replace:

'username' => 'root',
'password' => 'root',

with: 

'username' => 'jugl_test',
'password' => 'jugl_test',


14. Change file owner and login under user 'user':

cd /var/www/jugl
mkdir web/files web/chat_files web/thumbs
chown -R user:user .
su user

15. Download geolite country database:

wget http://geolite.maxmind.com/download/geoip/database/GeoLite2-Country.tar.gz
tar -xvf GeoLite2-Country.tar.gz
mkdir data
mv GeoLite2-Country_*/GeoLite2-Country.mmdb data/
rm -rf GeoLite2-Country_*


16. Install composer and bower packets:
 
cd /var/www/jugl
composer install

cd /var/www/jugl/web
npm install
bower install

17. In separate console login under user 'user' and start gulp for angular app compilation and recompilation after editing files:

cd /var/www/jugl/web
gulp


18. copy jugl_chatserv repo folder contents to /var/www/jugl_chatserv

19. In separate console login under root and prepare chat server:
cd /var/www/jugl_chatserv
chmod -R user:user .
su user
npm install


20. in config/config.js replace 'webserver1404' to your hostname (see output of "hostname" command)

21. Run chatserver:

nodejs app.js


#!/bin/bash

got_sigkill=0

_term() { 
  echo "Caught SIGTERM signal!" 
  kill -QUIT "$child" 2>/dev/null
}

trap _term TERM

#sh /templater.sh /etc

getent passwd user  > /dev/null
if [ $? -ne 0 ]; then
    adduser --home /var/www/jugl_app --uid 1000 --no-create-home --disabled-login user
fi

chown user:user /var/www

cd /var/www/*

gosu user npm install &

child=$!
wait "$child"
if [ "$got_sigkill" -eq "1" ]; then
   exit;
fi

cd src

#gosu user bower install &
#
#child=$!
#wait "$child"
#if [ "$got_sigkill" -eq "1" ]; then
#   exit;
#fi
#
gosu user npm install &

child=$!
wait "$child"
if [ "$got_sigkill" -eq "1" ]; then
   exit;
fi

gosu user gulp watch &

child=$!
wait "$child"
if [ "$got_sigkill" -eq "1" ]; then
   exit;
fi

sleep 3600
#chown -R user:user /opt
#$ANDROID_HOME/tools/bin/sdkmanager --update
#cordova build android

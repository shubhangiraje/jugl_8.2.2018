# $ANDROID_HOME/tools/bin/sdkmanager --licenses && chmod -R 777 /opt/android


FROM beevelop/cordova:v7.1.0
MAINTAINER Pavel Gushcha <pavimus@gmail.com>

RUN apt-get update && apt-get install -y gosu git ruby ruby-dev gcc make gettext && gem install compass


COPY rootfs/ /

RUN npm i -g gulp bower

CMD ["sh","/run.sh"]

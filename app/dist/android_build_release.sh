#!/bin/bash

rm bin/Jugl.apk
rm -rf ../www/*
rm ../platforms/android/build/outputs/apk/release/*

set -e

../docker/cordova-cli "cd src && gulp deploy"

../docker/cordova-cli cordova build --release android

../docker/cordova-cli jarsigner -storepass tester -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore dist/my-release-key.keystore platforms/android/build/outputs/apk/release/android-release-unsigned.apk alias_name

../docker/cordova-cli zipalign -v 4 platforms/android/build/outputs/apk/release/android-release-unsigned.apk dist/bin/Jugl.apk

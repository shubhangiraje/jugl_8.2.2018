#!/bin/bash

rm -rf ../www/*
cd ../src
gulp deploy
cordova prepare

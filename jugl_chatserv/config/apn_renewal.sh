#!/bin/bash

# generate key & csr
# openssl req -out apple-push-sandbox.csr -new -newkey rsa:2048 -nodes -keyout apple-push-sandbox.key
# openssl req -out apple-push-production.csr -new -newkey rsa:2048 -nodes -keyout apple-push-production.key

# convert certificate to pem
openssl x509 -inform der -in aps_development.cer -out apple-push-sandbox.pem -outform PEM
openssl x509 -inform der -in aps.cer -out apple-push-production.pem -outform PEM

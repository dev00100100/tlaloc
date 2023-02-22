#!/bin/bash
BASEDIR=/var/www/tlaloc
cd $BASEDIR

pwd

git fetch --all
git reset --hard origin/master
git pull origin master

echo "Updating BASE URL on shared.js file."

# get ip
LOCAL_IP=`ip route get 8.8.8.8 | sed -n '/src/{s/.*src *\([^ ]*\).*/\1/p;q}'`
echo "LOCAL IP $LOCAL_IP"

node post.js $LOCAL_IP

DIR=$BASEDIR/certificates

if [ -d "$DIR" ]; then
    echo "Certificate $DIR exist"

    KEY=$DIR/key.pem
    CERT=$DIR/cert.pem
    echo "KEY $KEY"
    echo "CERT $CERT"
    if [[ ! -f "$KEY" ]] || [[ ! -f "$CERT" ]]; then
        echo "CERTIFICATES files doesn't exist"
        echo "Creating CERTIFICATES files"
        openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 10000 -subj "/CN=$LOCAL_IP" -nodes
    fi
else
    echo "Creating CERTIFICATE folder"
    mkdir $DIR
    echo "Creategin CERTIFICATES files"
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 10000 -subj "/CN=$LOCAL_IP" -nodes
fi

echo "CERTIFICATES DONE"

echo "Restarting PM2 server."

pm2 restart app.js

echo "DEPLOY SCRIPT COMPLETED"
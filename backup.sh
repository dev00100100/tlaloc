#!/bin/bash

echo "$(date) - Starting Backup"
cd  ~/Documentos/mongo
pwd

mongodump

DATE=$(date '+%Y%m%d')
ZIPFILENAME="instagram_$DATE.zip" 
echo "$(date) - $ZIPFILENAME"


echo "$(date) - Creating ZIP File"
zip -r $ZIPFILENAME  dump/instagram


echo "$(date) - Deleting Instagram Folder"
rm -r dump/instagram


echo "$(date) - Creating backup $ZIPFILENAME to drive"

rclone $ZIPFILENAME drive:

echo "$(date) - Deleting $ZIPFILENAME"
rm $ZIPFILENAME

echo "$(date) - BACKUP COMPLETED"

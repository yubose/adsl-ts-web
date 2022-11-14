#!/bin/bash
# https://help.aliyun.com/document_detail/50452.html?spm=5176.8466035.help.dexternal.7e001450AfhsTr
~/ossutilmac64 rm oss://aitmed-webapp/ -r
~/ossutilmac64 cp -r output/apps/web/ oss://aitmed-webapp/

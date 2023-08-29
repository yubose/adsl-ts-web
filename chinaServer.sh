#!/bin/bash
# https://help.aliyun.com/document_detail/50452.html?spm=5176.8466035.help.dexternal.7e001450AfhsTr
# ossutil rm oss://aitmed-webapp/ -r
# ossutil cp -r output/apps/web/ oss://aitmed-webapp/
# ossutil64 rm oss://aitmed-webapp/ -r
# ossutil64 cp -r output/apps/web/ oss://aitmed-webapp/
~/ossutilmac64 rm oss://aitmed-webapp/ -r
~/ossutilmac64 cp -r output/apps/web/ oss://aitmed-webapp/
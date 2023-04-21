#!/bin/bash
# https://help.aliyun.com/document_detail/50452.html?spm=5176.8466035.help.dexternal.7e001450AfhsTr
ossutil rm oss://aitmed-webapp/ -r
ossutil cp -r output/apps/web/ oss://aitmed-webapp/

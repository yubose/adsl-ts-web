#!/bin/bash
if ["$1" -gt"-1" ]
then echo "请输入webapp项目路径"
else
    npm run build:test
    rm -rf $1/web
    cp -r ./output/apps/web $1
    cd $1
    git pull
    git add .
    git commit -a -m "update build"
    git push
fi


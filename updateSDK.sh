#!/bin/bash
npm install @aitmed/cadl@latest
npm install @aitmed/ecos-lvl2-sdk@latest
npm i noodl-ui@latest
npm i noodl-types@latest

cd apps/web
npm install @aitmed/cadl@latest
npm install @aitmed/ecos-lvl2-sdk@latest
npm i noodl-ui@latest
npm i noodl-types@latest

git add .
git commit -a -m "update aitmed sdk, inlcude lvl2,lvl3,noodl-ui"
git push

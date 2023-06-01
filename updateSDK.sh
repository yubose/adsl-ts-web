#!/bin/bash
npm install @aitmed/cadl@1.4.14
npm install @aitmed/ecos-lvl2-sdk@1.4.244
npm i noodl-ui@0.1.1130
npm i noodl-types@latest

cd apps/web
npm install @aitmed/cadl@1.4.14
npm install @aitmed/ecos-lvl2-sdk@1.4.244
npm i noodl-ui@0.1.1130
npm i noodl-types@latest

git add .
git commit -a -m "update aitmed sdk, inlcude lvl2,lvl3,noodl-ui"
git push




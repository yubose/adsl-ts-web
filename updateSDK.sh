#!/bin/bash
npm install @aitmed/cadl@1.0.838-1
npm install @aitmed/ecos-lvl2-sdk@1.4.210
npm i noodl-ui@0.1.1110
npm i noodl-types@1.0.264

cd apps/web
npm install @aitmed/cadl@1.0.838-1
npm install @aitmed/ecos-lvl2-sdk@1.4.210
npm i noodl-ui@0.1.1110
npm i noodl-types@1.0.264

git add .
git commit -a -m "update aitmed sdk, inlcude lvl2,lvl3,noodl-ui"
git push

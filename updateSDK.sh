#!/bin/bash
npm install @aitmed/cadl@1.6.13-7
npm install @aitmed/ecos-lvl2-sdk@1.4.254
npm i noodl-ui@0.1.1164
npm i noodl-types@latest

cd apps/web
npm install @aitmed/cadl@1.6.13-7
npm install @aitmed/ecos-lvl2-sdk@1.4.254
npm i noodl-ui@0.1.1164
npm i noodl-types@latest

git add .
git commit -a -m "update aitmed sdk, inlcude lvl2,lvl3,noodl-ui"
git push




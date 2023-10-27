#!/bin/bash
npm install @aitmed/cadl@latest
npm install @aitmed/ecos-lvl2-sdk@1.4.255
npm i noodl-ui@0.1.1167
npm i noodl-types@1.0.270

cd apps/web
npm install @aitmed/cadl@latest
npm install @aitmed/ecos-lvl2-sdk@1.4.255
npm i noodl-ui@0.1.1167
npm i noodl-types@1.0.270

git add .
git commit -a -m "update aitmed sdk, inlcude lvl2,lvl3,noodl-ui"
git push




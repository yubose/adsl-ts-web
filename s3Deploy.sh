#!/bin/bash
DDIR="build"
if [ $1 != "" ]
then
DDIR=$1
fi

#aws s3 sync ${DDIR}/ s3://test.aitmed.com --delete

if [ -z "$2" ]
then
DBucket="test.aitmed.com"
CloudFrontID="E23VGVK9SI3AEE"
else
# for devtest.aitmed.com
DBucket=$2
if [ "$DBucket" = "devtest.aitmed.com" ]
then
CloudFrontID="E2KLJ4USOZTTNE"
else
# for cadltest.aitmed.com
CloudFrontID="E1O68VOULBOMAT"
fi

aws s3 rm s3://${DBucket} --recursive
aws s3 cp ${DDIR}/ s3://${DBucket} --recursive
aws cloudfront create-invalidation --distribution-id ${CloudFrontID} --paths "/*"

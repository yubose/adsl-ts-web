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
        CloudFrontID="E3V53AV2M0GF5H"
    else
        # for cadltest.aitmed.com
        CloudFrontID="E1O68VOULBOMAT"
    fi
fi

BackupBucket='backup.aitmed.com'
TimeStamp=$(date "+%Y-%m-%dT%Hh%Mm%Ss")
BackupDirName=${DBucket}${TimeStamp}

# create
aws s3 cp s3://${DBucket} s3://${BackupBucket}/${BackupDirName}/ --recursive
aws s3 rm s3://${DBucket} --recursive
aws s3 cp ${DDIR}/ s3://${DBucket} --recursive
aws s3 cp ${DDIR}/index.html s3://${DBucket} --content-type text/html --cache-control no-cache,no-store,must-revalidate --expires "0"
#disable invalidate aws cloudfront create-invalidation --distribution-id ${CloudFrontID} --paths "/*"

#!/bin/bash
if [[ ! -z "$1" ]]; then
    noodlDevPort=$1
elif [[ -z "$noodlDevPort" ]]; then
    echo noodlDevPort is not set, use 8080 as default
    noodlDevPort=8080
fi

echo set noodlDevPort to $noodlDevPort

sed -e "/noodlDevPortENV/s/noodlDevPortENV/${noodlDevPort}/" <htdocs/indexTemp.html >htdocs/index.html
sed -e "/noodlDevPortENV/s/noodlDevPortENV/${noodlDevPort}/" <runTemp.sh >run.sh
sed -e "/noodlDevPortENV/s/noodlDevPortENV/${noodlDevPort}/" <config/configTemp.yml >config/aitmed.yml

chmod +x run.sh

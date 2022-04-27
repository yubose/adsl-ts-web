#!/bin/bash
curl $1 &> /dev/stdout | sed -e 's/>/>\n/g' | grep timestamp

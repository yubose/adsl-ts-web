#!/bin/bash
docker run \
    --rm \
	--detach \
	--name alnoodlapp \
        -v $PWD/noodlfiles:/var/www/localhost/htdocs/noodlfiles \
        -v $PWD/config:/var/www/localhost/htdocs/config \
	--mount type=bind,source=/etc/localtime,destination=/etc/localtime,readonly=true \
	--mount type=bind,source=$PWD/htdocs,destination=/var/www/localhost/htdocs \
	--publish noodlDevPortENV:80 \
	--publish 18443:443 \
	noodlapp:webapp

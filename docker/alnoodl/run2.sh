#!/bin/bash
docker run \
	--detach \
	--name alnoodlapp \
	--mount type=bind,source=/etc/localtime,destination=/etc/localtime,readonly=true \
	--mount type=bind,source=$PWD/htdocs,destination=/var/www/localhost/htdocs \
	--publish 8081:80 \
	--publish 18443:443 \
	alnoodl:webapp

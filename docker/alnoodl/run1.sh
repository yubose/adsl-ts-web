#!/bin/bash
docker run \
	--detach \
	--name alnoodl1 \
	--mount type=bind,source=/etc/localtime,destination=/etc/localtime,readonly=true \
	--mount type=bind,source=/Users/yuhangao/aitmed/aitmed-noodl-web/output/apps/web,destination=/var/www/localhost/htdocs \
	--publish 8081:80 \
	--publish 18443:443 \
	alnoodl:test1

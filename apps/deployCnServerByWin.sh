#!/bin/bash
ossutil rm oss://aitmed-webapp/ -r
ossutil cp -r output/apps/web/ oss://aitmed-webapp/
#!/bin/bash
# convert 
# remove empty line
# convert Uppercase to lowercase
tr '[:upper:]' '[:lower:]' | sed -f split.cmd | sed -f stopword.cmd  | sort | uniq
#| tr '\n' ', '

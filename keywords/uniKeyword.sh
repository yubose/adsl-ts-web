#!/bin/bash
# convert 
# remove empty line
# convert Uppercase to lowercase
tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-zA-Z0-9]+/\n/g' | sed -f stopword.cmd  | sort -f | uniq -ui | tr '\n' ', '

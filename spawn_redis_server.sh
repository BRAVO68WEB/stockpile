#!/bin/sh
#
# DON'T EDIT THIS!
#
# CodeCrafters uses this file to test your code. Don't make any changes here!
#
# DON'T EDIT THIS!
currentLoc=$(pwd)
yarn app init --name "stockpile-db" --port 6379 --configpath $currentLoc/stockpile.json --dumppath $currentLoc/db/stockpile.db
exec yarn app start --configpath $currentLoc/stockpile.json

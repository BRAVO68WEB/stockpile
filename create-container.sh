#!/bin/bash

touch stockpile.json

echo "Do you want to enable authentication? (y/n)"
read auth

echo "Enter desired port"
read port

if([ $auth = "y" ])
then
    echo "Enter password"
    read password
    docker run -v ./stockpile.json:/root/.stockpile.config.json stockpile app/bootstrap.js  init --name "stockpile-db" --port 6379 --auth $password
fi
if([ $auth = "n" ])
then
    docker run -v ./stockpile.json:/root/.stockpile.config.json stockpile app/bootstrap.js  init --name "stockpile-db" --port 6379
fi

docker run -d -p $port:6379 -v ./stockpile.json:/root/.stockpile.config.json -v ./db/stockpile.db:/root/.stockpile.dump stockpile app/bootstrap.js start --configpath /root/.stockpile.config.json
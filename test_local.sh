#!/bin/bash

echo " Test Redis PING command"
redis-cli ping

echo " Test Redis SET and GET commands"
redis-cli set name John
redis-cli get name

echo " Test Redis DEL command"
redis-cli del name
redis-cli get name

echo " Test Redis ECHO command"
redis-cli echo "Hello, Redis!"

echo " Test Redis EXISTS command"
redis-cli set name John
redis-cli exists name
redis-cli del name
redis-cli exists name

echo " Test Redis KEYS command"
redis-cli set name John
redis-cli set age 30
redis-cli keys "*"

echo " Test Redis STRLEN command"
redis-cli set message "Hello, Redis!"
redis-cli strlen message

echo " Test Redis SETNX command"
redis-cli setnx name John
redis-cli setnx name Jane

echo " Test Redis SETRANGE and GETRANGE commands"
redis-cli set greeting "Hello, World!"
redis-cli setrange greeting 7 "Redis"
redis-cli getrange greeting 0 11

echo " Test Redis MSET and MGET commands"
redis-cli mset fruit1 apple fruit2 orange fruit3 banana
redis-cli mget fruit1 fruit2 fruit3

echo " Test Redis FLUSHDB and FLUSHALL commands"
redis-cli flushdb
redis-cli set name John
redis-cli flushall

echo " Test Redis DBSIZE command"
redis-cli set fruit1 apple
redis-cli set fruit2 orange
redis-cli dbsize

echo " Test Redis SELECT command"
redis-cli select 1
redis-cli set fruit1 apple
redis-cli get fruit1

echo " Clean up by deleting all keys"
redis-cli flushall
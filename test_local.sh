#!/bin/bash

echo "Test Redis PING command"
redis-cli ping

echo "Test Redis SET and GET commands"
redis-cli set name John
redis-cli get name

echo "Test Redis DEL command"
redis-cli del name
redis-cli get name

echo "Test Redis ECHO command"
redis-cli echo "Hello, Redis!"

echo "Test Redis EXISTS command"
redis-cli set name John
redis-cli exists name
redis-cli del name
redis-cli exists name

echo "Test Redis KEYS command"
redis-cli set name John
redis-cli set age 30
redis-cli keys "*"

echo "Test Redis STRLEN command"
redis-cli set message "Hello, Redis!"
redis-cli strlen message

echo "Test Redis SETNX command"
redis-cli setnx name John
redis-cli setnx name Jane

echo "Test Redis SETRANGE and GETRANGE commands"
redis-cli set greeting "Hello, World!"
redis-cli setrange greeting 7 "Redis"
redis-cli getrange greeting 0 11

echo "Test Redis MSET and MGET commands"
redis-cli mset fruit1 apple fruit2 orange fruit3 banana
redis-cli mget fruit1 fruit2 fruit3

echo "Test Redis FLUSHDB and FLUSHALL commands"
redis-cli flushdb
redis-cli set name John
redis-cli flushall

echo "Test Redis DBSIZE command"
redis-cli set fruit1 apple
redis-cli set fruit2 orange
redis-cli dbsize

echo "Test Redis SELECT command"
redis-cli select 1
redis-cli set fruit1 apple
redis-cli get fruit1

echo "Test Redis RANDOMKEY command"
redis-cli randomkey

echo "Test Redis INCR and DECR commands"
redis-cli set count 10
redis-cli incr count
redis-cli decr count

echo "Test Redis INCRBY and DECRBY commands"
redis-cli set count 10
redis-cli incrby count 5
redis-cli decrby count 3

echo "Test Redis EXPIRE, TTL, and EXPIREAT commands"
redis-cli set name John
redis-cli expire name 10
redis-cli ttl name
redis-cli expireat name "$(date -v +10S +%s)"
redis-cli persist name

echo "Test Redis HGET, HSET, HGETALL, and HSETNX commands"
redis-cli hmset person name John age 30
redis-cli hget person name
redis-cli hset person email john@example.com
redis-cli hgetall person
redis-cli hsetnx person name Jane

echo "Test Redis HINCRBY command"
redis-cli hmset counter clicks 10 views 20
redis-cli hincrby counter clicks 5
redis-cli hget counter clicks

echo "Test Redis HDEL command"
redis-cli hmset person name John age 30 email john@example.com
redis-cli hdel person email
redis-cli hgetall person

echo "Test Redis HEXISTS command"
redis-cli hmset person name John age 30
redis-cli hexists person name
redis-cli hexists person email

echo "Test Redis HKEYS command"
redis-cli hmset person name John age 30
redis-cli hkeys person

echo "Test Redis HLEN command"
redis-cli hmset person name John age 30
redis-cli hlen person

echo "Test Redis HSTRLEN command"
redis-cli hmset person name John age 30
redis-cli hstrlen person name

echo "Test Redis HVALS command"
redis-cli hmset person name John age 30
redis-cli hvals person

echo "Clean up by deleting all keys"
redis-cli flushall
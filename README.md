# Welcome to stockpile 👋

[![Version](https://img.shields.io/npm/v/@bravo68web/stockpile.svg)](https://www.npmjs.com/package/stockpile)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/BRAVO68WEB/stockpile#readme)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/BRAVO68WEB/stockpile/graphs/commit-activity)
[![License: MIT](https://img.shields.io/github/license/BRAVO68WEB/stockpile)](https://github.com/BRAVO68WEB/stockpile/blob/master/LICENSE)
[![Twitter: BRAVO68WEB](https://img.shields.io/twitter/follow/BRAVO68WEB.svg?style=social)](https://twitter.com/BRAVO68WEB)

> A Tiny Redis Server with no external dependencies ...

Stockpile is a Tiny Redis Server, created from scratch in Node.js with only few dependencies. It is a work in progress, and is not yet ready for production use. It was initially a part of [CodeCrafter's - Create Redis Challenge](https://app.codecrafters.io/courses/redis/). But, I decided to make it a standalone project. I will be adding more features to it, and will be using it in my future projects. I will also be adding more tests to it. If you want to contribute, please feel free to do so.

### 🏠 [Homepage](https://github.com/BRAVO68WEB/stockpile#readme)

## Usage

```sh
git clone  https://github.com/BRAVO68WEB/stockpile
cd stockpile
yarn
./spawn_redis_server.sh 
```

OR

>Not test with ts release

```sh
npx @bravo68web/stockpile help
```

## SDKs

-   [Node.js](https://github.com/BRAVO68WEB/stockpile-node-sdk)

## ChangeLog

-    **Mar 11, 2023** - Initial Commit
-    **Mar 11, 2023** - Added `SET`, `GET`, `DEL` and `PING` commands
-    **Mar 12, 2023** - Added `ECHO`, `EXISTS`, `KEYS`, `APPEND`, `STRLEN` commands
-    **Mar 12, 2023** - Added `INCR`, `DECR`, `INCRBY`, `DECRBY` commands
-    **MAR 14, 2023** - Added `SETNX`, `SETRANGE`, `GETRANGE`, `MSET`, `MGET`, `FLUSHDB`, `FLUSHALL`, `DBSIZE`, `RANDOMKEY`  commands
-    **MAR 15, 2023** - Added `EXPIRE`, `TTL`, `PERSIST`, `EXPIREAT`, `PEXPIREAT`, `PERSIST`, `MOVE`, `SELECT` commands
-    **MAR 17, 2023** - Added `Added feature to dump/restore data and `AUH` command support
-    **MAR 18, 2023** - Release v0.1.0 and Added npx support
-    **MAR 19, 2023** - Added `BSON` for buffer support and Added `/health` endpoint for HTTP health check
-    **MAR 19, 2023** - Dockerizing application
-    **MAY  8, 2023** - Added Github Actions to Build Image to `GitHub Container Registry`
-    **MAY  9, 2023** - Rewrite code to Typescript
-    *... more to come*

## Development

```sh
git clone https://github.com/BRAVO68WEB/stockpile.git
cd stockpile
```

## Run tests

```sh
./spawn_redis_server.sh &
./test_local.sh
```

## Author

👤 **Jyotirmoy <BRAVO68WEB> Bandyopadhayaya**

-   Website: https://itsmebravo.dev
-   Twitter: [@BRAVO68WEB](https://twitter.com/BRAVO68WEB)
-   Github: [@BRAVO68WEB](https://github.com/BRAVO68WEB)
-   LinkedIn: [@BRAVO68WEB](https://linkedin.com/in/BRAVO68WEB)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/BRAVO68WEB/stockpile/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2023 [Jyotirmoy "BRAVO68WEB" Bandyopadhayaya](https://github.com/BRAVO68WEB).

This project is [MIT](https://github.com/BRAVO68WEB/stockpile/blob/master/LICENSE) licensed.

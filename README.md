node-notification-queue
=======================

Nofitication service test assignment for PlayKot. `NotificationApi` is a stub for VK.com API

## Prerequisites

* Node.js `4.0.x`
* MondoDB `3.0.x`

## Installation

* Insall with `npm install`
* For develop purposes you should install gulp with `npm install -g gulp`

## Usage

* Run with `npm start` to run server

## Playing around

Bare server is pretty boring (but can be run against existing db). There also is a set of development/configurations tasks, that can be runned by `gulp`

Task flow:
* `db:reset` - drops database
* `db:seed` - seeds database with random names, trying to emitate real payload.
* `db:indices` - generates useful indices for expected collections
* `db:recreate` - runs above steps in sequence
* `task:plain` - creates and runs plaintext task
* `task:nominal` - creates and runs task, which requires pattern replace.

### Seed configuration

Task `db:seed` generates name dictionary of the given size and seeds database in chunks to be able to seed million of users (it takes some time).
You can use `--seed-size x`, `--seed-step x` and `--name-count x` parameters to configure this task execution.
Default configuration is 10m users with 50k names, seeded in chunks by 1m.

## License

MIT

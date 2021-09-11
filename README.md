# Morphware: Contracts

# Description

This repository contains the smart contracts that are not directly related to
Morphware Token (i.e., `../token`).

`JobFactory` is handles the majority of interaction with `../daemon`,
while `VickreyAuction` is solely focused on the job auction-process.

# API

TODO

# Setup

## Prerequisites

You will need:

* Node. All of us are using Node v16.x
  * You may want to use NVM to manage this.

You may want:

* Docker
  * This makes running the test suite easier

## Initial steps

These are steps you should only have to take once.

```
npm install
docker run --detach --publish 8545:8545 trufflesuite/ganache-cli:latest
```

Running the Ganache CLI via Docker is simpler than running it via `npx`. If you
would prefer to run it via `npx`:

```
npx ganache-cli
```

If you do that, you will need to keep a terminal devoted to the Ganache CLI.
Running the Ganache CLI via Docker doesn't consume a terminal.

## Every feature branch

There are currently no steps to take every time you create a feature branch.

# Development

## Running the tests

The unit tests are run with `npm test`.

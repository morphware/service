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
```

Running the Ganache CLI via Docker is simpler than running it via `npx`. To do
so, run the following:
```
docker run --detach --publish 8545:8545 trufflesuite/ganache-cli:latest
```

If you would prefer to run it via `npx` instead, run the following:
```
npx ganache-cli
```

If you do that, you will need to keep a terminal devoted to the Ganache CLI.
Running the Ganache CLI via Docker doesn't consume a terminal.

## Every feature branch

There are currently no steps to take every time you create a feature branch.

# Development

These are steps you will take for every feature branch.

## Process

We require that you will create a feature branch off of `main`. You will do all
of your work there, then create a pull request in GitHub to merge back into
`main`. You will get at least one approval before merging.

**DO NOT**:
* Commit and push directly to `main`
* Merge back into `main` without a reviewer approving

If you do any of those things, your commit privileges will be revoked on the
first offense. If you have accidentally committed to `main` locally, please
reach out on #dev for help.

## Running the tests

The unit tests are run with `npm test`. They presume Ganache CLI is running
(q.v. Initial Steps for more information).

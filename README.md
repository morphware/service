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

- Node. All of us are using Node v16.x
  - You may want to use NVM to manage this.

## Initial steps

These are steps you should only have to take once.

```
yarn install
```

## Every feature branch

There are currently no steps to take every time you create a feature branch.

# Development

These are steps you will take for every feature branch.

## Process

We require that you will create a feature branch off of `main`. You will do all
of your work there, then create a pull request in GitHub to merge back into
`main`. You will get at least one approval before merging.

**DO NOT**:

- Commit and push directly to `main`
- Merge back into `main` without a reviewer approving

If you do any of those things, your commit privileges will be revoked on the
first offense. If you have accidentally committed to `main` locally, please
reach out on #dev for help.

## Running the tests

The unit tests are run with `yarn test:unit`.

Coverage is run with `yarn coverage`. Currently, this is not hooked into the
unit testing process. It will eventually be hooked in where a drop in coverage
will fail the test run, even if the tests themselves pass.

## Notes for future iterations

- Early stopping
- Vickrey Auction, using the SimpleAuction contract?
- Active monitoring - Micropayment channel?
- Implement a form of a reputation score that basically updates how off
  a given `endUser`'s estimation is of their workload's training time
- Have `../daemon` look-up the `trainedModelMagnetLink` in the logs instead of re-parameterizing it, below.

`rewardSchedule` is currently thought to be either a:

- Continuous Reward (TBA: worker is rewarded essentially for descending the gradient)
- Variable Reward (Early Stopping; kind-of a Boolean pay-off structure:
  as workers will only be rewarded if they have reached a threshold-level of accuracy)
- Fixed Interval Reward (Active Monitoring)
- Fixed Ratio Reward (for validators(?); as they will verify a certain number of models over a period of time:
  even if the selection process for them is pseudo-random?)...encoded as a `string` or a series of `bytes`

#!/usr/bin/env bash

rm -f build/contracts/*

#npx truffle compile

npx truffle migrate --network development

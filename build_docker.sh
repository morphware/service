#!/bin/bash -eu

ROOT=$(cd $(dirname $0) && pwd)
cd $ROOT

VERSION=$(jq -r '.version' < ${ROOT}/package.json)

IMAGE_NAME="morphware/contract"

docker build \
  --network=host \
  -t "${IMAGE_NAME}:${VERSION}" \
  -t "${IMAGE_NAME}:latest" \
    .


# The reason we're using this image vs. the trufflesuite/ganache-cli:v6.1.0
# is because it's based on a non-Debian image, which makes life hard.
# This is a Debian 10 (buster) image
FROM node:16.14.0

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN npm install

COPY . .

EXPOSE 8545

# GanacheCLI is installed as a dependency of Hardhat.
ENTRYPOINT [ "/usr/src/app/node_modules/.bin/ganache-cli", "-h", "0.0.0.0" ]

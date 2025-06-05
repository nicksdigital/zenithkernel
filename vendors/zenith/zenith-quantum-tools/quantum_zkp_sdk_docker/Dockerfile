FROM node:16.20.2-slim

# Install dependencies
RUN apt-get update &&     apt-get install -y build-essential git curl libssl-dev pkg-config &&     curl https://sh.rustup.rs -sSf | sh -s -- -y &&     . "$HOME/.cargo/env" &&     rustup install stable &&     rustup default stable

# Install Circom 2.1.6
ENV PATH="/root/.cargo/bin:${PATH}"
RUN cargo install --locked --git https://github.com/iden3/circom --tag v2.1.6

# Install SnarkJS
RUN npm install -g snarkjs@0.6.11

# Prepare app
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

ENTRYPOINT ["npx", "tsx", "dist/cli.js"]
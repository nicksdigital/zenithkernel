FROM node:18.20.8

# Install system dependencies
RUN apt-get update && apt-get install -y \
  build-essential git curl libssl-dev pkg-config && \
  curl https://sh.rustup.rs -sSf | sh -s -- -y && \
  . "$HOME/.cargo/env" && \
  rustup install stable && rustup default stable

# Add Rust bin to PATH
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Circom 2.1.6
RUN cargo install --locked --git https://github.com/iden3/circom --tag v2.1.6

# Copy package.json and install deps
COPY package*.json ./
RUN npm install

# Install global tools
RUN npm install -g typescript tsx snarkjs@0.6.11

# Set working directory
WORKDIR /app

# Copy rest of app
COPY . .

# Build TypeScript
RUN npm run build

# Default to interactive shell
CMD ["bash"]

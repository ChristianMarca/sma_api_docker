
FROM node:10.14.1

# Create app directory
RUN mkdir -p /usr/src/sma_api
WORKDIR /usr/src/sma_api

# Install app dependencies
COPY package.json /usr/src/sma_api
RUN npm install

# Bundle app source
COPY . /usr/src/sma_api

# Build arguments
ARG NODE_VERSION=10.14.1

# Environment
ENV NODE_VERSION $NODE_VERSION

# Images
# FROM node:10.14.1

# WORKDIR /usr/src/sma_api

# COPY ./ ./

# RUN npm install

# CMD ["/bin/bash"]

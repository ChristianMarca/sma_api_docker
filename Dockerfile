# Images
FROM node:10.14.1

WORKDIR /usr/src/sma_api

COPY ./ ./

RUN npm install

CMD ["/bin/bash"]
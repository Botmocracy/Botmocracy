FROM node:20.11.1-alpine

ENV HOME=/home/app

COPY package.json $HOME/node_docker/

WORKDIR $HOME/node_docker

RUN npm install --silent --progress=false

COPY . $HOME/node_docker

CMD ["npm", "start"]
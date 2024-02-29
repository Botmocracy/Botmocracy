FROM node:20.1-debian

ENV HOME=/home/app

RUN apt-get update && apt-get install htop

COPY package.json $HOME/node_docker/

WORKDIR $HOME/node_docker

RUN npm install --silent --progress=false

COPY . $HOME/node_docker

CMD ["npm", "start"]
FROM node:16.13.1

RUN apt-get update && \
    apt-get install -y vim

WORKDIR /opt/app

COPY src /opt/app

run npm install

CMD ["node", "/opt/app/index.js"]
FROM node:alpine

WORKDIR /usr/app

COPY package.json .

RUN yarn

COPY . .

EXPOSE 6379

ENTRYPOINT ["node"]
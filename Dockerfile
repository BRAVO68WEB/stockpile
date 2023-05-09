FROM node:alpine

WORKDIR /usr/app

COPY package.json .
COPY . .

RUN yarn
RUN yarn build

EXPOSE 6379

ENTRYPOINT ["yarn app"]
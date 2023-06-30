FROM node:15.2.1-alpine3.10

WORKDIR /src

COPY package*.json ./

RUN npm install

COPY --chown=node:node . .

EXPOSE 3000

CMD [ "npm", "start" ]
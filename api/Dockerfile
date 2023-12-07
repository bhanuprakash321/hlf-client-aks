FROM node:18-alpine

WORKDIR /usr/api/app
COPY package*.json ./

COPY . .

RUN  npm install

EXPOSE 3000

CMD ["npm","start"]

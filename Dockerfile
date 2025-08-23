FROM node:alpine

WORKDIR /app

COPY package*.json .
COPY src ./src
COPY utils ./utils
COPY index.html .
COPY index.js .
COPY vite.config.js .
COPY config.js .

RUN npm i

CMD ["npm","start"]
FROM node:alpine

WORKDIR /app

COPY docker-package.json package.json
COPY index.js index.js
COPY dist dist
RUN npm i

EXPOSE 3000
CMD ["npm","start"]
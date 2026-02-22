FROM node:25-alpine

WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm install
COPY --chown=node:node . .

EXPOSE 6693
CMD ["npm", "run", "start"]

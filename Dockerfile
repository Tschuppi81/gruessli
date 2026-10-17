FROM node:22-alpine
WORKDIR /app
COPY package.json server.js index.html layout.js ./

ENV PORT=80 DATA_DIR=/data
EXPOSE 80
CMD ["node", "server.js"]

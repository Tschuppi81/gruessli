FROM node:22-alpine
WORKDIR /app
COPY server.js index.html ./

ENV PORT=80 DATA_DIR=/data
EXPOSE 80
CMD ["node", "server.js"]

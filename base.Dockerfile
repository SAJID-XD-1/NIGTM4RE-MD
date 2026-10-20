FROM node:20

RUN apt update && apt install -y ffmpeg 
WORKDIR /app
RUN git clone https://github.com/lyfe00011/levanter.git .
COPY extra-plugins/autofollow.js plugins/autofollow.js
COPY extra-plugins/autojoin.js plugins/autojoin.js
RUN yarn install

CMD ["node", "index.js"]

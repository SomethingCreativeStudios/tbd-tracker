FROM node:12.13.1

RUN npm install webpack -g

RUN apt-get update -qq && apt-get install -y yarn

# Create app directory
WORKDIR /src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./


COPY . .

EXPOSE 3000

CMD yarn start:prod
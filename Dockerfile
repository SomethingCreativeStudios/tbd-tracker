FROM node:16.10 AS BUILD_IMAGE

# Create app directory
WORKDIR /src/app

COPY package.json yarn.lock ./

COPY . .

# install dependencies
RUN yarn --frozen-lockfile

RUN yarn build

RUN rm -r ./node_modules && yarn --frozen-lockfile --production=true


# remove development dependencies

FROM node:16.10

WORKDIR /src/app

# copy from build image
COPY --from=BUILD_IMAGE /src/app/dist ./dist
COPY --from=BUILD_IMAGE /src/app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /src/app/src ./src
COPY --from=BUILD_IMAGE /src/app/package.json ./package.json

ENV TZ="America/New_York"

RUN apt-get update -qq

RUN yarn global add typeorm && rm -rf /etc/localtime && ln -s /usr/share/zoneinfo/America/New_York /etc/localtime

EXPOSE 3000

CMD [ "yarn", "start:docker" ]
FROM node:16.10 AS BUILD_IMAGE

# Create app directory
WORKDIR /src/app

COPY package.json yarn.lock ./

COPY . .

# install dependencies
RUN yarn --frozen-lockfile

# install dependencies
RUN  yarn --frozen-lockfile

RUN yarn build


# remove development dependencies

FROM node:16.10

WORKDIR /src/app

# copy from build image
COPY --from=BUILD_IMAGE /src/app/dist ./dist
COPY --from=BUILD_IMAGE /src/app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /src/app/package.json ./package.json
COPY --from=BUILD_IMAGE /src/app/scripts ./scripts
COPY --from=BUILD_IMAGE /src/app/tsconfig.json ./tsconfig.json
COPY --from=BUILD_IMAGE /src/app/tsconfig.build.json ./tsconfig.build.json
COPY --from=BUILD_IMAGE /src/app/src ./src


ENV TZ="America/New_York"

RUN npm install tsconfig-paths -g && npm install ts-node -g && npm install typeorm -g && rm -rf /etc/localtime && ln -s /usr/share/zoneinfo/America/New_York /etc/localtime

EXPOSE 3000

CMD [ "yarn", "start:docker" ]
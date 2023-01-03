const { workerData, parentPort } = require('worker_threads');
const { MediaService } = require('../dist/src/modules/media/media.service');
const { ConfigService } = require('../dist/src/config/config.service');

const { data = [] } = workerData;

const media = new MediaService(null, new ConfigService());

async function getData() {
  for await (const { name, link } of data) {
    const items = await media.find(name);

    parentPort.postMessage({
      link,
      items: items.map((item) => ({
        associatedLinks: item.associatedLinks,
        description: item.description,
        displayName: item.displayName,
        id: item.id,
        imagePath: item.imagePath,
        rating: item.rating,
        releaseDate: item.releaseDate,
      })),
    });
  }
}

getData();

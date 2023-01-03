import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as tasks from './startup/tasks';
import { TaskLoader } from './startup/TaskLoader';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PirateScrapper } from './modules/scrapers/pirate.scraper';
import { MediaService } from './modules/media/media.service';
require('dotenv').config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.enableCors();

  const options = new DocumentBuilder()
    .setTitle('TBD Tracker API')
    .setDescription('API')
    .setVersion('1.0')
    .addTag('tbd-tracker-api')
    .addBearerAuth({ bearerFormat: 'JWT', scheme: 'bearer', type: 'http' })
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('documentation', app, document);

  await app.listen(3000);

  // Run startup tasks
  await TaskLoader.loadTasks(tasks, app);

  const service = await app.get(MediaService);

  //const results = await PirateScrapper.search('top100:48h_207');

  //console.log(await service.find(results[0].parsedName));

  //console.log(await PirateScrapper.search('top100:48h_207'));
}
bootstrap();

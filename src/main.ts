import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as tasks from './startup/tasks';
import { TaskLoader } from './startup/TaskLoder';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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
}
bootstrap();

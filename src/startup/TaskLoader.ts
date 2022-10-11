import { INestApplication } from '@nestjs/common';
import { BaseTask } from './BaseTask';
export class TaskLoader {
  static async loadTasks(tasks: any, app: INestApplication) {
    const taskNames = Object.keys(tasks).sort();

    for (let i = 0; i < taskNames.length; i++) {
      const taskName = taskNames[i];
      const task = <BaseTask>new tasks[taskName](app);
      await task.executeTask();
    }

    console.log('Done running tasks');
  }
}

import { INestApplication } from '@nestjs/common';
import { TaskService } from '../modules/tasks';

/**
 * A base task used for start up
 */
export abstract class BaseTask {
  public taskService: TaskService;

  constructor(public app: INestApplication) {
    this.taskService = app.get(TaskService);
  }

  /**
   * Run the task
   */
  public abstract async executeTask(): Promise<void>;

}

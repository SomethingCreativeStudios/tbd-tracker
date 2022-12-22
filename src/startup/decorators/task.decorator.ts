import { TaskService } from '../../modules/tasks';

export const UpgradeTask = (taskName: string, description: string) => (target, key, descriptor) => {
  const oldFunc = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const taskService = this.taskService as TaskService;
    const foundTask = await taskService.findByName(taskName);

    if (!foundTask) {
      console.log('Starting upgrade process...');
      console.log(` - Upgrade Process: ${taskName}`);
      await oldFunc.apply(this, args);
      await taskService.createTask(taskName, description);
      console.log('Done with upgrade process');
    } else {
      console.log(`Skipping Upgrade Process: ${taskName}`);
    }
  };
};

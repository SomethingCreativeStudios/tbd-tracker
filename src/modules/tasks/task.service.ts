import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './models';
import { TaskRepository } from './task.repository';

@Injectable()
export class TaskService {

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: TaskRepository,
  ) { }

  async findAll(): Promise<Task[]> {
    return await this.taskRepository.find();
  }

  async findByName(taskName: string) {
    return await this.taskRepository.findOne({ where: { name: taskName } })
  }

  async createTask(taskName: string, description: string) {
    return await this.taskRepository.save({ name: taskName, description: description })
  }
}

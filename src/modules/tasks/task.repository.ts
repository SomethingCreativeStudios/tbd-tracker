import { Repository } from 'typeorm';
import { Task } from './models';

export class TaskRepository extends Repository<Task> { }

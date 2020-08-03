import { Repository } from 'typeorm';
import { User } from './models';

export class UserRepository extends Repository<User> {}

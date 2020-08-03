import { Repository } from 'typeorm';
import { Role } from './models/role.entity';

export class RoleRepository extends Repository<Role> {}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './models/role.entity';
import { RoleRepository } from './role.repository';
import { RoleName } from '../../decorators/RolesDecorator';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: RoleRepository,
  ) {}

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find();
  }

  async create(role: Role): Promise<Role> {
    return await this.roleRepository.save(role);
  }

  async convertRolesToRoleNames(roles: Role[]): Promise<RoleName[]> {
    return <RoleName[]>roles.map(role => {
      return RoleName[role.name.toUpperCase()];
    });
  }
}

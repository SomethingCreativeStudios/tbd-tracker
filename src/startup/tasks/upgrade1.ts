import { INestApplication } from '@nestjs/common';
import { BaseTask } from '../BaseTask';
import { UserService, User } from '../../modules/user';
import { ConfigService } from '../../config/config.service';
import { Role, RoleService } from '../../modules/role';
import { UpgradeTask } from '../decorators/task.decorator';


export class Upgrade1 extends BaseTask {
  private userService: UserService;
  private roleService: RoleService;

  private configService: ConfigService;

  constructor(app: INestApplication) {
    super(app);
    this.userService = app.get(UserService);
    this.configService = app.get(ConfigService);
    this.roleService = app.get(RoleService);
  }

  @UpgradeTask('User Set Up', 'task to create base user and base admin')
  async executeTask(): Promise<void> {
    const player = await this.userService.findByUsername('User');
    const admin = await this.userService.findByUsername('Admin');

    if (player === undefined) {
      console.log('Creating default "player" user');
      const playerPassword = this.configService.defaultPasswords.user;
      await this.createUser('User', playerPassword, 'user');
    }

    if (admin === undefined) {
      console.log('Creating default "admin" user');
      const adminPassword = this.configService.defaultPasswords.admin;
      await this.createUser('Admin', adminPassword, 'admin');
    }
  }

  /**
   * Create new user with role and password
   * @param userName
   * @param password
   * @param role
   */
  private async createUser(userName: string, password: string, roleName: string) {
    const newUser = new User();

    newUser.username = userName;
    newUser.password = password;
    newUser.roles = [await this.getRole(roleName)];

    return await this.userService.create(newUser);
  }

  private async getRole(roleName: string) {
    const roles = await this.roleService.findAll();
    const foundRole = roles.find(role => role.name === roleName);

    if (foundRole) {
      return foundRole;
    }

    const newRole = new Role();
    newRole.name = roleName;
    newRole.description = roleName;

    return this.roleService.create(newRole);
  }
}

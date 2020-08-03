import { INestApplication } from '@nestjs/common';
import { BaseTask } from '../BaseTask';
import { UserService, User } from '../../modules/user';
import { ConfigService } from '../../config/config.service';
import { Role } from '../../modules/role';
import { UpgradeTask } from '../decorators/task.decorator';


export class Upgrade1 extends BaseTask {
  private userService: UserService;

  private configService: ConfigService;

  constructor(app: INestApplication) {
    super(app);
    this.userService = app.get(UserService);
    this.configService = app.get(ConfigService);
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
    const newRole = new Role();

    newRole.name = roleName;
    newRole.description = '';

    newUser.username = userName;
    newUser.password = password;
    newUser.roles = [newRole];

    return await this.userService.create(newUser);
  }
}

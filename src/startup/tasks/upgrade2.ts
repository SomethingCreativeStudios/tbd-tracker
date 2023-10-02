import { INestApplication } from '@nestjs/common';
import { BaseTask } from '../BaseTask';
import { UserService, User } from '../../modules/user';
import { ConfigService } from '../../config/config.service';
import { Role, RoleService } from '../../modules/role';
import { UpgradeTask } from '../decorators/task.decorator';
import { TorrentService } from '~/modules/torrent/torrent.service';

export class Upgrade2 extends BaseTask {
  private torrentService: TorrentService;

  constructor(app: INestApplication) {
    super(app);
    this.torrentService = app.get(TorrentService);
  }

  @UpgradeTask('Resume Downloads', 'resume downloads/queues', true)
  async executeTask(): Promise<void> {
    await this.torrentService.resumeStuff();
  }
}

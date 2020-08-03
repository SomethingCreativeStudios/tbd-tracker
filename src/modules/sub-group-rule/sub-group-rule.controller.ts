import { ApiTags } from '@nestjs/swagger';
import { Controller } from '@nestjs/common';
import { SubGroupRuleService } from './sub-group-rule.service';

@ApiTags('SubgroupRule')
@Controller('api/v1/SubgroupRule')
export class SubgroupRuleController {
  constructor(private readonly subgroupRuleService: SubGroupRuleService) {}
}

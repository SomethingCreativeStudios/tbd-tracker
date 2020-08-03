import { SubGroupService } from './sub-group.service';
import { ApiTags } from '@nestjs/swagger';
import { Controller } from '@nestjs/common';

@ApiTags('Subgroup')
@Controller('api/v1/Subgroup')
export class SubgroupController {
  constructor(private readonly subgroupService: SubGroupService) {}
}

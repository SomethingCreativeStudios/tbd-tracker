import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { SubGroupRuleService } from './sub-group-rule.service';
import { SubGroupService } from '../sub-group/sub-group.service';
import { Server } from 'http';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { SubGroup } from '../sub-group/models';
import { DeepPartial } from 'typeorm';
import { mergeDeepRight } from 'ramda';
import { SubGroupRule } from './models';
import { SeriesService } from '../series/series.service';

@WebSocketGateway(8180, { namespace: 'subgrouprule' })
export class SubGroupRuleGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private subgroupService: SubGroupService,
    @Inject(forwardRef(() => SeriesService)) private seriesService: SeriesService,
    private subgroupRuleService: SubGroupRuleService,
  ) {}
  afterInit(server: any) {}
  handleConnection(client: any, ...args: any[]) {}
  handleDisconnect(client: any) {}

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('SubgroupRuleGateway');

  @SubscribeMessage('update')
  async updateRule(@MessageBody() { subgroupId, rule }: { subgroupId: number; rule: SubGroupRule }) {
    const foundRule = await this.subgroupRuleService.findOne({ id: rule.id });
    const foundGroup = await this.subgroupService.findOne({ id: subgroupId });

    await this.subgroupRuleService.update(mergeDeepRight(foundRule, rule) as SubGroupRule);

    return this.seriesService.findById(foundGroup.series.id);
  }

  @SubscribeMessage('create')
  async addRule(@MessageBody() data: { subgroupId: number; rule: SubGroupRule }) {
    const foundGroup = await this.subgroupService.findOne({ id: data.subgroupId });
    foundGroup.rules.push(data.rule);

    await this.subgroupService.update(foundGroup);

    return this.seriesService.findById(foundGroup.series.id);
  }

  @SubscribeMessage('delete')
  async deleteRule(@MessageBody() data: { subgroupId: number; ruleId: number }) {
    const foundGroup = await this.subgroupService.findOne({ id: data.subgroupId });
    foundGroup.rules = foundGroup.rules.filter(rule => rule.id === data.ruleId);

    await this.subgroupService.update(foundGroup);

    return this.seriesService.findById(foundGroup.series.id);
  }
}

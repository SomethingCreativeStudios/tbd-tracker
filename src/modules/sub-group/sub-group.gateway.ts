import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Server } from 'socket.io';
import { SubGroupService } from './sub-group.service';
import { SubGroup } from './models';
import { DeepPartial } from 'typeorm';
import { mergeDeepRight } from 'ramda';
import { SeriesService } from '../series/series.service';

@WebSocketGateway(8180, { namespace: 'subgroup' })
export class SubGroupGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(@Inject(forwardRef(() => SeriesService)) private seriesService: SeriesService, private subgroupService: SubGroupService) {}
  afterInit(server: any) {}
  handleConnection(client: any, ...args: any[]) {}
  handleDisconnect(client: any) {}

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('SubgroupGateway');

  @SubscribeMessage('create')
  async createSubgroup(@MessageBody() data: { seriesId: number; subgroup: SubGroup }) {
    data.subgroup.series = await this.seriesService.findById(data.seriesId);

    await this.subgroupService.create(data.subgroup);

    return this.seriesService.findById(data.seriesId);
  }

  @SubscribeMessage('remove')
  async removeSubgroup(@MessageBody() id: number) {
    const foundGroup = await this.subgroupService.findOne({ id });
    await this.subgroupService.delete(foundGroup);

    return this.seriesService.findById(foundGroup.series.id);
  }

  @SubscribeMessage('update')
  async updateSubgroup(@MessageBody() subgroup: DeepPartial<SubGroup>) {
    const foundGroup = await this.subgroupService.findOne({ id: subgroup.id });

    await this.subgroupService.update(mergeDeepRight(foundGroup, subgroup) as SubGroup);

    return this.seriesService.findById(foundGroup.series.id);
  }

  @SubscribeMessage('subgroup-names')
  async fetchNames() {
    return this.subgroupService.findNames();
  }
}

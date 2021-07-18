import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Server } from 'socket.io';
import { SubGroupService } from './sub-group.service';
import { SubGroup } from './models';
import { DeepPartial } from 'typeorm';
import { mergeDeepRight } from 'ramda';
import { SeriesService } from '../series/series.service';
import { CreateSubGroupDTO } from './dtos/CreateSubGroupDTO';
import { UpdateSubGroupDTO } from './dtos/UpdateSubGroupDTO';

@WebSocketGateway(8180, { namespace: 'subgroup' })
export class SubGroupGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private subgroupService: SubGroupService) {}
  afterInit(server: any) {}
  handleConnection(client: any, ...args: any[]) {}
  handleDisconnect(client: any) {}

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('SubgroupGateway');

  @SubscribeMessage('create')
  async createSubgroup(@MessageBody() createModel: CreateSubGroupDTO) {
    return this.subgroupService.create(createModel);
  }

  @SubscribeMessage('remove')
  async removeSubgroup(@MessageBody() id: number) {
    return this.subgroupService.delete(id);
  }

  @SubscribeMessage('update')
  async updateSubgroup(@MessageBody() updateModel: UpdateSubGroupDTO) {
    this.subgroupService.update(updateModel);
  }

  @SubscribeMessage('subgroup-names')
  async fetchNames() {
    return this.subgroupService.findNames();
  }
}

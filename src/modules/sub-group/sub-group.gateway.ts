import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Logger, Inject, forwardRef, UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import { SubGroupService } from './sub-group.service';
import { CreateSubGroupDTO } from './dtos/CreateSubGroupDTO';
import { UpdateSubGroupDTO } from './dtos/UpdateSubGroupDTO';
import { SocketGuard } from '~/guards/SocketGuard';

@WebSocketGateway(8180, { namespace: 'subgroup', transports: ['websocket'] })
export class SubGroupGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private subgroupService: SubGroupService) { }
  afterInit(server: any) { }
  handleConnection(client: any, ...args: any[]) { }
  handleDisconnect(client: any) { }

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('SubgroupGateway');

  @UseGuards(SocketGuard)
  @SubscribeMessage('create')
  async createSubgroup(@MessageBody() createModel: CreateSubGroupDTO) {
    return this.subgroupService.create(createModel);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('remove')
  async removeSubgroup(@MessageBody() id: number) {
    return this.subgroupService.delete(id);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('find-by-series')
  async findBySeries(@MessageBody() id: number) {
    return this.subgroupService.findBySeries(id);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('update')
  async updateSubgroup(@MessageBody() updateModel: UpdateSubGroupDTO) {
    return this.subgroupService.update(updateModel);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('subgroup-names')
  async fetchNames() {
    return this.subgroupService.findNames();
  }
}

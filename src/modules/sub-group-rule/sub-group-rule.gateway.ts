import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { SubGroupRuleService } from './sub-group-rule.service';
import { Server } from 'http';
import { Logger, UseGuards } from '@nestjs/common';
import { UpdateSubGroupRuleDTO } from './dtos/UpdateSubGroupRuleDTO';
import { CreateSubGroupRuleDTO } from './dtos/CreateSubGroupRuleDTO';
import { SocketGuard } from '~/guards/SocketGuard';

@WebSocketGateway(8180, { namespace: 'subgrouprule', transports: ['websocket'] })
export class SubGroupRuleGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private subgroupRuleService: SubGroupRuleService) { }
  afterInit(server: any) { }
  handleConnection(client: any, ...args: any[]) { }
  handleDisconnect(client: any) { }

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('SubgroupRuleGateway');

  @UseGuards(SocketGuard)
  @SubscribeMessage('update')
  async updateRule(@MessageBody() updateModel: UpdateSubGroupRuleDTO) {
    return this.subgroupRuleService.update(updateModel);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('create-many')
  async addRule(@MessageBody() createModel: CreateSubGroupRuleDTO) {
    return this.subgroupRuleService.createMany(createModel);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('find-by-subgroup')
  async findBySubgroup(@MessageBody() subgroupId: number) {
    return this.subgroupRuleService.findBySubgroup(subgroupId);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('delete')
  async deleteRule(@MessageBody() ruleId: number) {
    return this.subgroupRuleService.delete(ruleId);
  }
}

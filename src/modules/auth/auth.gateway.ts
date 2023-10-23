import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Inject, Logger, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Server, Socket } from 'socket.io';
import { Cache } from 'cache-manager';
import { SocketService } from '../socket/socket.service';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';

@WebSocketGateway(8180, { namespace: 'auth', transports: ['websocket'] })
export class AuthGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private roleService: RoleService,
    private socketService: SocketService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}
  afterInit(server: Server) {
    this.socketService.authSocket = server;
  }

  async handleConnection(client: Socket, ...args: any[]) {}
  handleDisconnect(client: any) {}

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('AuthGateway');

  @SubscribeMessage('token')
  async login(@MessageBody() { username, password }: { username: string; password: string }) {
    const foundUser = await this.userService.findByUsername(username);

    // check password
    if (!(await this.userService.samePassword(foundUser, password))) {
      throw new UnauthorizedException();
    }

    // convert roles to useable roles
    const roles = await this.roleService.convertRolesToRoleNames(foundUser.roles);
    return await this.authService.createSessionId(roles);
  }

  @SubscribeMessage('validate-token')
  async validateToken(@MessageBody() { token }: { token: string }) {
    const found = await this.cacheManager.get(`sess:${token}`);

    return !!found;
  }
}

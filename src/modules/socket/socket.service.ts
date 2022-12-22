import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  public socket: Server = null;
  public nyaaSocket: Server = null;
  public seriesSocket: Server = null;
  public subgroupSocket: Server = null;
  public subgroupRuleSocket: Server = null;
  public settingsSocket: Server = null;
  public authSocket: Server = null;
  public malSocket: Server = null;
}

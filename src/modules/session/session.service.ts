import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { isBefore, addDays } from 'date-fns';
import { Repository } from "typeorm";
import { RoleName } from "~/decorators/RolesDecorator";
import { UserService } from "../user/user.service";
import { Session, SessionType } from "./models/session.entity";

@Injectable()
export class SessionService {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,


        private readonly userService: UserService,
    ) { }

    async create(username: string, payload: string[], type: SessionType, howLong: number) {
        const newSession = new Session();
        const foundUser = await this.userService.findByUsername(username);

        newSession.user = foundUser;
        newSession.payload = payload;
        newSession.type = type;
        newSession.expireDate = addDays(new Date(), howLong);

        return this.sessionRepository.create(newSession);
    }

    async findSessionByUserName(username: string) {
        return this.sessionRepository.find({ where: { user: { username } }, relations: ['user'] });
    }

    async validateSession(sessionId: string, validRole: RoleName) {
        const foundSession = await this.sessionRepository.findOne({ where: { id: sessionId } });

        if (!foundSession) {
            return false;
        }

        if (isBefore(foundSession.expireDate, new Date())) {

        }
    }

    //handle expired sessions
}
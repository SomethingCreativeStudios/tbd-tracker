import { Post, Get, Body, Controller, UseGuards, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RoleName } from '../../decorators/RolesDecorator';
import { AuthService, AccessToken } from '../auth';
import { RoleService } from '../role';
import { RolesGuard } from '../../guards';
import { CreateToken } from './request';
import { User } from './models';
import { ApiTags, ApiHideProperty, ApiBody, ApiResponse, ApiBodyOptions, ApiExcludeEndpoint } from '@nestjs/swagger';

@ApiTags('User')
@Controller('api/v1/Users')
export class UserController {
  constructor(private readonly userService: UserService, private readonly authService: AuthService, private readonly roleService: RoleService) {}

  @Get()
  @Roles(RoleName.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiExcludeEndpoint()
  async root(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Post()
  @Roles(RoleName.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiExcludeEndpoint()
  @ApiHideProperty()
  async create(@Body() request: User): Promise<User> {
    return await this.userService.create(request);
  }

  @Post('auth')
  @ApiBody({ description: 'Create new token for auth', type: CreateToken })
  @ApiResponse({ status: 201, description: 'New token used for auth', type: AccessToken })
  async createToken(@Body() request: CreateToken): Promise<any> {
    const foundUser = await this.userService.findByUsername(request.username);

    // check password
    if (!(await this.userService.samePassword(foundUser, request.password))) {
      throw new UnauthorizedException();
    }

    // default to five mins
    request.ttl = request.ttl ? request.ttl : 300;

    // convert roles to useable roles
    const roles = await this.roleService.convertRolesToRoleNames(foundUser.roles);
    return await this.authService.createToken(roles, request.ttl);
  }
}

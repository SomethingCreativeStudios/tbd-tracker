import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './models';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  private saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({ relations: ['roles'] });
  }

  /**
   * Store user in database. Follows these steps
   * 1) Hashes password
   * 2) Saves user (will auto-create roles)
   * @param user
   * @param hashPassword should the password be hased?
   * @returns The newly created user
   */
  async create(user: User, hashPassword: boolean = true): Promise<User> {
    if (hashPassword) {
      // never store password in plain text!!!
      user.password = bcrypt.hashSync(user.password, this.saltRounds);
    }
    return await this.userRepository.save(user);
  }

  /**
   * Find user with username
   * @param username
   */
  async findByUsername(username: string): Promise<User> {
    return await this.userRepository.findOne({ where: { username }, relations: ['roles'] });
  }

  /**
   * Check if user's password is the same and 'password'
   * @param user User to check
   * @param password password to check
   * @returns {boolean} are the passwords the same?
   */
  async samePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compareSync(password, user.password);
  }
}

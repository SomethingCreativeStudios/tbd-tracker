import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IgnoreLinkRepository } from './ignore-link.repository';
import { IgnoreLink } from './models/ignore-link.entity';

@Injectable()
export class IgnoreLinkService {
  constructor(
    @InjectRepository(IgnoreLink)
    private readonly ignoreLinkRepository: IgnoreLinkRepository,
  ) {}

  public async create(link: string) {
    const foundLink = await this.ignoreLinkRepository.findOne({ where: { link } });

    if (foundLink) {
      return foundLink;
    }

    return this.ignoreLinkRepository.save({ link });
  }

  public async delete(link: string) {
    const foundLink = await this.ignoreLinkRepository.findOne({ where: { link } });

    if (foundLink) {
      await this.ignoreLinkRepository.delete(foundLink.id);
    }
  }

  public async findAll() {
    return (await this.ignoreLinkRepository.find()) || [];
  }
}

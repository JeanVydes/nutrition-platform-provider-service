import type { ISchoolConfigRepository } from '../../../domain/repositories/school-config.repository';

export class FindAllSchoolIdsUseCase {
  constructor(private readonly schoolConfigRepo: ISchoolConfigRepository) {}

  async execute(): Promise<string[]> {
    return this.schoolConfigRepo.findAllSchoolIds();
  }
}

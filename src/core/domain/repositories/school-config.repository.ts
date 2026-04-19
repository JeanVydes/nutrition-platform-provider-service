export interface ISchoolConfigRepository {
  findAllSchoolIds(): Promise<string[]>;
}

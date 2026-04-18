export class Student {
  constructor(
    public readonly idEstudiante: string,
    public readonly idAccount: string,
    public readonly idColegio: string,
    public readonly creadoEn: Date | null
  ) {}
}

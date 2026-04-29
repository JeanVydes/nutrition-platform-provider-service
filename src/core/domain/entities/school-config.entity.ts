export class SchoolConfig {
  constructor(
    public readonly idColegio: string,
    public readonly hostDb: string,
    public readonly puertoDb: number,
    public readonly nombreDb: string,
    public readonly usuarioDb: string | null,
    public readonly schoolName: string | null,
    public readonly creadoEn: Date | null
  ) {}
}

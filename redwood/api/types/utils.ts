type Primitive = string | number | bigint | boolean | null | undefined

export type Replaced<T, TReplace, TWith, TKeep = Primitive> = T extends
  | TReplace
  | TKeep
  ? T extends TReplace
    ? TWith | Exclude<T, TReplace>
    : T
  : {
      [P in keyof T]: Replaced<T[P], TReplace, TWith, TKeep>
    }

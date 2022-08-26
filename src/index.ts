export declare interface CsvParserOptions {
  /**
   * Defines the separator to use
   * @default ','
   */
  separator?: ',' | ';' | '\t'

  /**
   * True if first line contains column headers, otherwise an array of strings containing the headers may be given
   * @default true
   */
  header?: true | string[]

  /**
   * Defines the delimiter of strings
   * @default '"'
   */
  stringDelimiter?: '\'' | '"'
}

export declare interface CsvCellMetadata {
  readonly columnIndex: number
  readonly columnName: string
  readonly rowIndex: number
  readonly cellReferenceA1: string
  readonly cellReferenceRC: string
}

class CsvCellMetadataClass implements CsvCellMetadata {
  constructor (
    readonly columnIndex: number,
    readonly columnName: string,
    readonly rowIndex: number
  ) {}

  get cellReferenceA1 (): string {
    return `${CsvCellMetadataClass.#convertNumberToLetter(this.columnIndex)}${this.rowIndex}`
  }

  get cellReferenceRC (): string {
    return `R${this.rowIndex}C${this.columnIndex}`
  }

  static #letterArray: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] = [
    'A', 'B', 'C', 'D',
    'E', 'F', 'G', 'H',
    'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X',
    'Y', 'Z'
  ]

  static #convertNumberToLetter (num: number): string {
    if (num === 1) return 'A'

    const out: number[] = []

    num--

    while (num > 0) {
      out.unshift(num % 26)
      num = Math.floor(num / 26)
    }

    return out
      .map((it, idx, { length }) => CsvCellMetadataClass.#letterArray[
        length > 1 && idx < length - 1
          ? it - 1
          : it
      ])
      .join('')
  }
}

/**
 * Simple CSV parse for JavaScript.
 * @param csv Input CSV data
 * @param options Parsing options
 * @param callbacks Object of optional callback functions to further parse CSV data.
 *                  Keys are column indexes or column header names.
 * @returns Promise of an array of objects resembling a line of CSV data
 * @async
 */
export default async function parseCSV<R extends Array<Record<any, any>>> (
  csv: string,
  { separator = ',', header = true, stringDelimiter = '"' }: CsvParserOptions = {},
  callbacks: Record<number|string, (str: string, metadata: CsvCellMetadata) => any> = {}
): Promise<R> {
  return await new Promise<R>((resolve, reject) => {
    const lines = csv.split(/\r?\n/g)
    const cells: string[][] = []

    for (let i = 0, line = lines[i]; i < lines.length; line = lines[++i]) {
      if (line === '') continue
      cells.push([''])
      const result = cells[i]
      let currentCell = 0
      let inString = false

      const incrementCell = (): void => {
        result[++currentCell] = ''
      }

      for (let c = 0, char = line[c]; c < line.length; char = line[++c]) {
        switch (char) {
          case separator:
            if (inString) {
              result[currentCell] += char
            } else incrementCell()
            break

          case stringDelimiter:
            if (inString && line[c + 1] === stringDelimiter) {
              result[currentCell] += char
              c++
            } else inString = !inString
            break

          default:
            result[currentCell] += char
        }
      }
    }

    if (cells.some(line => line.length !== cells[0].length)) {
      return reject(new SyntaxError('Malformed CSV'))
    }

    const headers = header === true
      ? cells[0]
      : header
    if (header === true) cells.shift()

    resolve(
      cells.map((line, rowIdx) => Object.fromEntries(
        headers.map((colName, colIdx) => [
          colName,
          colName in callbacks
            ? callbacks[colName](line[colIdx], new CsvCellMetadataClass(colIdx + 1, colName, rowIdx + 1))
            : colIdx in callbacks
              ? callbacks[colIdx](line[colIdx], new CsvCellMetadataClass(colIdx + 1, colName, rowIdx + 1))
              : line[colIdx]
        ])
      )) as R
    )
  })
}

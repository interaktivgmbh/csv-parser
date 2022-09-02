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

const characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const numberToCharacters = (num: number): string => {
  if (num === 1) return 'A'

  const out: number[] = []

  num--

  while (num > 0) {
    out.unshift(num % 26)
    num = Math.floor(num / 26)
  }

  return out
    .map((it, idx, { length }) => characters[
      length > 1 && idx < length - 1
        ? it - 1
        : it
    ])
    .join('')
}

const csvCellMetadataFactory = (columnIndex: number, columnName: string, rowIndex: number): CsvCellMetadata => {
  return {
    columnIndex,
    columnName,
    rowIndex,
    cellReferenceA1: `${numberToCharacters(columnIndex)}${rowIndex}`,
    cellReferenceRC: `R${rowIndex}C${columnIndex}`
  }
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
            ? callbacks[colName](line[colIdx], csvCellMetadataFactory(colIdx + 1, colName, rowIdx + 1))
            : colIdx in callbacks
              ? callbacks[colIdx](line[colIdx], csvCellMetadataFactory(colIdx + 1, colName, rowIdx + 1))
              : line[colIdx]
        ])
      )) as R
    )
  })
}

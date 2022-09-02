export interface CsvCellMetadata {
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

export interface CsvParserOptions {
  /**
   * True if first line contains column headers, otherwise an array of strings containing the headers may be given
   * @default true
   */
  header?: true | string[]

  /**
   * Defines the separator to use
   * @default ','
   */
  separator?: string

  /**
   * Defines the delimiter of strings
   * @default '"'
   */
  stringDelimiter?: '\'' | '"'
}

export type CsvParserCallbackFunction<T = any> = (str: string, metadata: CsvCellMetadata) => T

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
  callbacks: Record<number | string, CsvParserCallbackFunction<T>> = {}
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

export async function toCsv (
  data: Array<Record<string | number, any>>,
  {
    separator = ',',
    stringDelimiter = '"'
  }: Omit<CsvParserOptions, 'header'> = {}
): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    if (data == null || data.length === 0) return reject(new SyntaxError('data not provided'))

    const csv: string[][] = [Object.keys(data[0])]

    for (let i = 0, rowData = data[i]; i < data.length; rowData = data[++i]) {
      const row = Object.values(rowData)
      csv.push([])

      for (let q = 0, cell = row[q]; q < row.length; cell = row[++q]) {
        if (cell === undefined || cell === null) {
          csv[i + 1].push('')
        } else if (typeof cell === 'function') {
          csv[i + 1].push(`[function ${(cell as Function).name}]`)
        } else if (cell instanceof Date) {
          csv[i + 1].push(cell.toISOString())
        } else if (typeof HTMLElement !== 'undefined' && cell instanceof HTMLElement) {
          csv[i + 1].push(
            cell.innerHTML != null
              ? cell.outerHTML.slice(0, cell.outerHTML.indexOf(cell.innerHTML))
              : cell.outerHTML
          )
        } else {
          csv[i + 1].push(cell.toString())
        }
      }
    }

    resolve(
      csv
        .map(row => row.map(
          cell => cell.includes('"')
            ? `${stringDelimiter}${cell.replace(new RegExp(stringDelimiter, 'g'), `${stringDelimiter}${stringDelimiter}`)}${stringDelimiter}`
            : cell.includes(' ') || cell.includes(separator)
              ? `${stringDelimiter}${cell}${stringDelimiter}`
              : cell
        ).join(separator))
        .join('\n')
    )
  })
}


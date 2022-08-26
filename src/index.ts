export interface CsvParserOptions {
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

/**
 * Simple CSV parse for JavaScript.
 * @param csv Input CSV data
 * @param options Parsing options
 * @returns Promise of an array of objects resembling a line of CSV data
 * @async
 */
export default async function parseCSV<R extends Array<Record<any, string>>> (
  csv: string,
  { separator = ',', header = true, stringDelimiter = '"' }: CsvParserOptions = {}
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
      cells.map(line => Object.fromEntries(
        headers.map((key, idx) => [key, line[idx]])
      )) as R
    )
  })
}

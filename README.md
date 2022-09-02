# Interaktiv CSV Parser

[![code style: ts-standard](https://img.shields.io/badge/code%20style-ts--standard-blue)](https://standardjs.com/)
![Version: 1.0.0](https://img.shields.io/badge/version-1.0.0-242424)

Simple CSV parser for JavaScript/TypeScript.

## Table of contents

1. [Installation](#installation)
2. [API Reference](#api-reference)
   1. [Functions](#functions)
      1. [fromCsv](#fromcsv)
         1. [Parameters](#parameters)
         2. [Options](#options)
         3. [Return Type](#return-type)
         4. [Reference](#reference)
         5. [Examples](#examples)
      2. [toCsv](#tocsv)
         1. [Parameters](#parameters-1)
         2. [Options](#options-1)
         3. [Return Type](#return-type-1)
         4. [Reference](#reference-1)
         5. [Examples](#examples-1)
   2. [Types](#types)
      1. [CsvCellMetadata](#csvcellmetadata)
         1. [Attributes](#attributes)
         2. [Reference](#reference-2)
      2. [CsvParserOptions](#csvparseroptions)
         1. [Attributes](#attributes-1)
         2. [Reference](#reference-3)
      3. [CsvParserCallbackFunction](#csvparsercallbackfunction)
         1. [Reference](#reference-4)

## Installation
```shell
# using yarn
$ yarn add @interaktiv.de/csv-parser

# using npm
$ npm i -S @interaktiv.de/csv-parser
```

## API Reference

### Functions

#### fromCsv

The asynchronous fromCsv function parses the input CSV data.

##### Parameters

| Name        | Type                                                                                                 | Required | Description                                                                                                                                                                                                              |
|-------------|------------------------------------------------------------------------------------------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `csv`       | `string`                                                                                             | Yes      | Input CSV data.                                                                                                                                                                                                          |
| `options`   | [`CsvParserOptions`](#csvparseroptions)                                                              | No       | Parsing options.                                                                                                                                                                                                         |
| `callbacks` | <code>Record&lt;number \| string, [CsvParserCallbackFunction](#csvparsercallbackfunction)&gt;</code> | No       | Function callbacks to further parse the strings retrieved from CSV.<br>The keys of the object may be column indices or column headers.<br>The values should be [CsvParserCallbackFunctions](#csvparsercallbackfunction). |

##### Options

The `options` parameter is of type [`CsvParserOptions`](#csvparseroptions).

| Name              | Type               | Default Value | Description                                                                                                        |
|-------------------|--------------------|---------------|--------------------------------------------------------------------------------------------------------------------|
| `header`          | `true \| string[]` | `true`        | True if first line contains column headers, otherwise an array of strings containing the headers must be provided. |
| `separator`       | `string`           | `','`         | Defines the separator of the CSV data.                                                                             |
| `stringDelimiter` | `'\'' \| '"'`      | `'"'`         | Defines the delimiter of strings in the CSV data.                                                                  |

##### Return Type

The function returns a Promise of an array of JavaScript objects.  
The object keys are the CSV column headers. Each object is a row of CSV.  
The type of the Objects may be described using the template `R`.

##### Reference

The fromCsv function is defined as follows:

```ts
async function fromCsv<R extends Record<string, T>, T = any> (
  csv: string,
  { separator = ',', header = true, stringDelimiter = '"' }: CsvParserOptions = {},
  callbacks: Record<number | string, CsvParserCallbackFunction<T>> = {}
): Promise<R[]>
```

##### Examples

```ts
// Sample CSV data
const csv = '1;Alan;Greer;"1971-01-21";ve@kuocu.mu\n'
  + '2;Julian;Chambers;"1971-11-07";oro@het.cy\n'
  + '3;"Anthony Lawrence";Stevens;"2003-05-26";covawe@nehotbeg.rw'

// Interface describing return type
interface User {
  readonly id: number
  readonly firstname: string
  readonly lastname: string
  readonly birthdate: Date
  readonly email: string
}

// Calling fromCsv
const userData: User[] = await fromCsv<User>(
  csv,
  {
    separator: ';',
    header: ['id', 'firstname', 'lastname', 'birthdate', 'email'],
  },
  {
    id: str => parseInt(str),
    birthdate: str => new Date(str)
  }
)

console.log(userData.map(({ id }) => id))  // [1, 2, 3]
console.log(userData[1].birthdate)         // Date(1971-11-07T23:00:00.000Z)
```

#### toCsv

The asynchronous toCsv function parses an array of objects to CSV.

##### Parameters

| Name        | Type                                                                     | Required | Description      |
|-------------|--------------------------------------------------------------------------|----------|------------------|
| `data`      | `string`                                                                 | Yes      | Input CSV data.  |
| `options`   | <code>Omit&lt;[CsvParserOptions](#csvparseroptions), 'header'&gt;</code> | No       | Parsing options. |

##### Options

The `options` parameter is of type <code>Omit&lt;[CsvParserOptions](#csvparseroptions), 'header'&gt;</code>.

| Name              | Type               | Default Value | Description                                       |
|-------------------|--------------------|---------------|---------------------------------------------------|
| `separator`       | `string`           | `','`         | Defines the separator of the CSV data.            |
| `stringDelimiter` | `'\'' \| '"'`      | `'"'`         | Defines the delimiter of strings in the CSV data. |

##### Return Type

The function returns a Promise of string.  

##### Reference

The fromCsv function is defined as follows:

```ts
async function toCsv (
  data: Array<Record<string | number, any>>,
  {
    separator = ',',
    stringDelimiter = '"'
  }: Omit<CsvParserOptions, 'header'> = {}
): Promise<string>
```

##### Examples

```ts
// Sample data
const data = [
  {
    id: 1,
    firstname: 'Alan',
    lastname: 'Greer',
    birthdate: new Date(1971-01-21),
    email: 've@kuocu.mu'
  },
  {
    id: 2,
    firstname: 'Julian',
    lastname: 'Chambers',
    birthdate: new Date(1971-11-07),
    email: 'oro@het.cy'
  },
  {
    id: 3,
    firstname: 'Anthony Lawrence',
    lastname: 'Stevens',
    birthdate: new Date(2003-05-26),
    email: 'covawe@nehotbeg.rw'
  }
]

// Calling toCsv
const csv = await toCsv(
  data,
  { separator: ';' }
)

console.log(csv)
/*
 * id;firstname;lastname;birthdate;email
 * 1;Alan;Greer;1971-01-21T00:00:00.000Z;ve@kuocu.mu
 * 2;Julian;Chambers;1971-11-07T00:00:00.000Z,oro@het.cy
 * 3;Anthony Lawrence;Stevens;2003-05-26T00:00:00.000Z,covawe@nehotbeg.rw
 */
```

### Types

#### CsvCellMetadata

The interface `CsvCellMetadata` describes metadata of a cell in CSV data.  
It contains information about column and row, as well as parsed cell references.

##### Attributes

| Name              | Type     | Description                                                             |
|-------------------|----------|-------------------------------------------------------------------------|
| `columnIndex`     | `number` | Column count, starting at 1.                                            |
| `columnName`      | `string` | Column name according to CSV column headers.                            |
| `rowIndex`        | `number` | Row count, starting at 1.                                               |
| `cellReferenceA1` | `string` | Cell reference (position) in MS Excel / LibreOffice Calc A1 notation.   |
| `cellReferenceRC` | `string` | Cell reference (position) in MS Excel / LibreOffice Calc R1C1 notation. |

##### Reference

The interface is defined as follows:

```ts
interface CsvCellMetadata {
  readonly columnIndex: number
  readonly columnName: string
  readonly rowIndex: number
  readonly cellReferenceA1: string
  readonly cellReferenceRC: string
}
```

#### CsvParserOptions

The interface `CsvParserOptions` describes the options which may be given to the [`fromCsv`](#fromcsv) and [`toCsv`](#tocsv) function.

##### Attributes

| Name              | Type               | Default Value | Description                                                                                                        |
|-------------------|--------------------|---------------|--------------------------------------------------------------------------------------------------------------------|
| `header`          | `true \| string[]` | `true`        | True if first line contains column headers, otherwise an array of strings containing the headers must be provided. |
| `separator`       | `string`           | `','`         | Defines the separator of the CSV data.                                                                             |
| `stringDelimiter` | `'\'' \| '"'`      | `'"'`         | Defined the delimiter of strings in the CSV data.                                                                  |

##### Reference

The interface is defined as follows:

```ts
interface CsvParserOptions {
  /**
   * True if first line contains column headers, otherwise an array of strings containing the headers may be given
   * @default true
   */
  header?: true | string[]

  /**
   * Defines the separator to use
   * @default ','
   */
  separator?: ',' | ';' | '\t'

  /**
   * Defines the delimiter of strings
   * @default '"'
   */
  stringDelimiter?: '\'' | '"'
}
```

#### CsvParserCallbackFunction

The type `CsvParserCallbackFunction` describes callback functions for the CSV parser to further parse the string data from CSV.

##### Reference

The type is defined as follows:

```ts
type CsvParserCallbackFunction<T = any> = (str: string, metadata: CsvCellMetadata) => T
```

---

<small>Made with &#x2764;&#xfe0f; by [Interaktiv](https://interaktiv.de).</small>
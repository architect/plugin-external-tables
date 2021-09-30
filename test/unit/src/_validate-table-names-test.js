let test = require('tape')
let { join } = require('path')
let sut = join(process.cwd(), 'src', '_validate-table-names')
let validateTableNames = require(sut)
let _inventory = require('@architect/inventory')

test('Set up env', t => {
  t.plan(1)
  t.ok(validateTableNames, 'Table name validator is present')
})

test('No table name conflicts', async t => {
  t.plan(2)
  let rawArc = `
@app
app
@tables
table-a
  id *String
`
  let queries = [
    { app: 'app-1', name: 'table-b' },
    { app: 'app-2', name: 'table-c' },
    { app: 'app-2', name: 'table-d' }
  ]
  let inventory = await _inventory({ rawArc })
  t.doesNotThrow(() => {
    validateTableNames(queries, inventory)
  }, 'No errors thrown when table names do not conflict')

  rawArc = `
@app
app
`
  inventory = await _inventory({ rawArc })
  t.doesNotThrow(() => {
    validateTableNames(undefined, inventory)
  }, 'No errors thrown / does not run when @tables are not defined')
})

test('Table name conflicts found', async t => {
  t.plan(1)
  let rawArc = `
@app
app
@tables
table-a
  id *String
table-b
  id *String
table-c
  id *String
`
  let queries = [
    { app: 'app-1', name: 'table-b' },
    { app: 'app-2', name: 'table-c' },
    { app: 'app-2', name: 'table-d' }
  ]
  let inventory = await _inventory({ rawArc })
  t.throws(() => {
    validateTableNames(queries, inventory)
  }, {
    message: 'The following external table names conflict with your @tables: table-b, table-c'
  }, 'Conflicts with two tables found: table-b, table-c')
})

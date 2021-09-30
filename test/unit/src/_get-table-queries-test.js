let test = require('tape')
let { join } = require('path')
let sut = join(process.cwd(), 'src', '_get-table-queries')
let getTableQueries = require(sut)
let _inventory = require('@architect/inventory')

test('Set up env', t => {
  t.plan(1)
  t.ok(getTableQueries, 'Get table queries module is present')
})

test('External tables (`@external-tables`)', async t => {
  t.plan(1)
  let rawArc = `
@app
app
@external-tables
app-1
  table-a
  table-b
app-2
  table-c
  table-d
`
  let correctQueries = [
    { app: 'app-1', name: 'table-a' },
    { app: 'app-1', name: 'table-b' },
    { app: 'app-2', name: 'table-c' },
    { app: 'app-2', name: 'table-d' }
  ]
  let { inv } = await _inventory({ rawArc })
  let arc = inv._project.arc
  let q = getTableQueries(arc['external-tables'])
  console.log('External table queries:', q)
  t.deepEqual(q, correctQueries, 'Got correct external table queries')
})

test('Other tables (`@other-tables`)', async t => {
  t.plan(1)
  let rawArc = `
@app
app
@other-tables
legacy-app-$arc_stage-data
diff-app-$arc_stage-users
users
products
`
  let correctQueries = [
    { app: 'legacy-app', name: 'data', legacy: true },
    { app: 'diff-app', name: 'users', legacy: true },
    { name: 'users' },
    { name: 'products' }
  ]
  let { inv } = await _inventory({ rawArc })
  let arc = inv._project.arc
  let q = getTableQueries(undefined, arc['other-tables'])
  console.log('Other table queries:', q)
  t.deepEqual(q, correctQueries, 'Got correct other table queries')
})

test('Invalid tables (`@other-tables`)', async t => {
  t.plan(1)
  let rawArc = `
@app
app
@other-tables
legacy-app-$arc_stage
`
  let { inv } = await _inventory({ rawArc })
  let arc = inv._project.arc
  t.throws(() => {
    getTableQueries(undefined, arc['other-tables'])
  }, {
    message: 'Invalid legacy table name: legacy-app-$arc_stage'
  }, 'Found invalid table name')
})

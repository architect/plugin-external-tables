let test = require('tape')
let { join } = require('path')
let sut = join(process.cwd(), 'src', '_get-table-queries')
let getTableQueries = require(sut)
let _inventory = require('@architect/inventory')

test('Set up env', t => {
  t.plan(1)
  t.ok(getTableQueries, 'Get table queries module is present')
})

test('Other Arc tables', async t => {
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

test('Legacy Arc tables', async t => {
  t.plan(1)
  let rawArc = `
@app
app
@external-tables
legacy-app-$arc_stage-data
diff-app-$arc_stage-users
`
  let correctQueries = [
    { app: 'legacy-app', name: 'data', legacy: true },
    { app: 'diff-app', name: 'users', legacy: true },
  ]
  let { inv } = await _inventory({ rawArc })
  let arc = inv._project.arc
  let q = getTableQueries(arc['external-tables'])
  console.log('Legacy table queries:', q)
  t.deepEqual(q, correctQueries, 'Got correct other table queries')
})

test('Physical table names', async t => {
  t.plan(1)
  let rawArc = `
@app
app
@external-tables
users
products
`
  let correctQueries = [
    { name: 'users' },
    { name: 'products' }
  ]
  let { inv } = await _inventory({ rawArc })
  let arc = inv._project.arc
  let q = getTableQueries(arc['external-tables'])
  console.log('Physical table name queries:', q)
  t.deepEqual(q, correctQueries, 'Got correct other table queries')
})

test('All the things', async t => {
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
legacy-app-$arc_stage-data
diff-app-$arc_stage-users
users
products
`
  let correctQueries = [
    { app: 'app-1', name: 'table-a' },
    { app: 'app-1', name: 'table-b' },
    { app: 'app-2', name: 'table-c' },
    { app: 'app-2', name: 'table-d' },
    { app: 'legacy-app', name: 'data', legacy: true },
    { app: 'diff-app', name: 'users', legacy: true },
    { name: 'users' },
    { name: 'products' }
  ]
  let { inv } = await _inventory({ rawArc })
  let arc = inv._project.arc
  let q = getTableQueries(arc['external-tables'])
  console.log('External table queries:', q)
  t.deepEqual(q, correctQueries, 'Got correct external table queries')
})

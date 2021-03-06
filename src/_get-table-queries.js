module.exports = function getTableQueries (externalTables) {
  let tableQueries = []
  externalTables.forEach(table => {
    if (typeof table === 'object') {
      let app = Object.keys(table)[0]
      table[app].forEach(name => tableQueries.push({ app, name }))
    }
    else {
      let stageVar = '$arc_stage'
      let legacyStage = /\$arc_stage/
      if (table.match(legacyStage)) {
        let bits = table.split(stageVar)
        if (bits.filter(Boolean).length !== 2) throw Error(`Invalid legacy table name: ${table}`)
        return tableQueries.push({
          app: bits[0].slice(0, -1),
          name: bits[1].slice(1),
          legacy: true,
        })
      }
      tableQueries.push({ name: table })
    }

  })
  return tableQueries
}

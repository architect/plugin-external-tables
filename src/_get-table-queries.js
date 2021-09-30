module.exports = function getTableQueries (externalTables, otherTables) {
  let tableQueries = []
  if (externalTables) {
    externalTables.forEach(list => {
      let app = Object.keys(list)[0]
      list[app].forEach(name => tableQueries.push({ app, name }))
    })
  }
  if (otherTables) {
    let stageVar = '$arc_stage'
    let legacyStage = /\$arc_stage/
    otherTables.forEach(table => {
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
    })
  }
  return tableQueries
}

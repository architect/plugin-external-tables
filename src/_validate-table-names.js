module.exports = function validateTableNames (tableQueries, inventory) {
  let { inv, get } = inventory
  if (inv.tables) {
    let errors = []
    tableQueries.forEach(({ name }) => {
      if (get.tables(name)) errors.push(name)
    })
    if (errors.length) {
      let list = [ ...new Set(errors) ].join(', ')
      throw Error(`The following external table names conflict with your @tables: ${list}`)
    }
  }
}

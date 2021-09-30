let _inventory = require('@architect/inventory')
let package = require('@architect/package')

module.exports = async function getTablesPolicy () {
  let rawArc = `@app\ndummy\n@tables\ndummy-table\n  pk *String`
  let inventory = await _inventory({ rawArc })
  let cfn = package(inventory)
  let policy = cfn.Resources.Role.Properties.Policies
    .find(item => item.PolicyName === 'ArcDynamoPolicy')
  // Clear the dummy table policy entries
  policy.PolicyDocument.Statement[0].Resource = []
  return policy
}

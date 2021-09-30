// eslint-disable-next-line
let aws = require('aws-sdk') // Assume AWS-SDK is installed via Arc
let { toLogicalID } = require('@architect/utils')

let getTableQueries = require('./_get-table-queries')
let validateTableNames = require('./_validate-table-names')
let getTablesPolicy = require('./_get-tables-policy')

async function package ({ arc, cloudformation, stage, inventory }) {
  let externalTables = arc['external-tables']
  let otherTables = arc['other-tables']

  if (!externalTables && !otherTables) return cloudformation
  let dynamo = new aws.DynamoDB()
  let ssm = new aws.SSM()

  // Prep for SSM and DynamoDB queries to get final table ARNs
  let tableQueries = getTableQueries(externalTables, otherTables)

  // Check for table name conflicts
  validateTableNames(tableQueries, inventory)

  let tables = []
  for (let table of tableQueries) {
    let TableName // aka the physical table name
    try {
      // Arc app physical names are stored in SSM service discovery
      if (table.app && !table.legacy) {
        let Name = `/${toLogicalID(table.app)}${toLogicalID(stage)}/tables/${table.name}`
        let { Parameter } = await ssm.getParameter({ Name }).promise()
        TableName = Parameter.Value
      }
      // Legacy Arc apps had convention-based naming
      else if (table.app) {
        TableName = `${table.app}-${stage}-${table.name}`
      }
      // Assume the bare table name provided is the physical name
      else TableName = table.name

      let { Table } = await dynamo.describeTable({ TableName }).promise()
      tables.push({
        arn: Table.TableArn,
        logicalName: table.name,
        physicalName: TableName,
      })
    }
    catch (err) {
      if (err.name === 'ParameterNotFound') {
        throw ReferenceError(`${table.name} not found for @app: ${table.app}`)
      }
      if (err.name === 'ResourceNotFoundException') {
        throw ReferenceError(`DynamoDB table not found: ${TableName}`)
      }
      throw (err)
    }
  }

  // If this project **only** uses external / other tables, backfill a DynamoDB policy
  if (!inventory.inv.tables) {
    let policy = await getTablesPolicy()
    cloudformation.Resources.Role.Properties.Policies.push(policy)
  }

  let index = cloudformation.Resources.Role.Properties.Policies
    .findIndex(item => item.PolicyName === 'ArcDynamoPolicy')
  tables.forEach(({ arn, logicalName, physicalName }) => {
    cloudformation.Resources.Role.Properties
      .Policies[index].PolicyDocument.Statement[0].Resource.push(
        arn,
        `${arn}/*`,
        `${arn}/stream/*`,
      )
    let resourceName = `${toLogicalID(logicalName)}ExtTable`
    cloudformation.Resources[resourceName] = {
      Type: 'AWS::SSM::Parameter',
      Properties: {
        Type: 'String',
        Name: {
          'Fn::Sub': [
            '/${AWS::StackName}/tables/${tablename}',
            {
              tablename: logicalName
            }
          ]
        },
        Value: physicalName
      }
    }
  })

  return cloudformation
}
module.exports = { package }

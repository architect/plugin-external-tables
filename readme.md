# `@architect/plugin-external-tables`

## Enable access to external DynamoDB tables from other Architect projects, legacy Architect projects, and non-Architect projects


### Installation

`npm i @architect/plugin-external-tables`

Add this line to your Architect project manifest (example given in Arc format):

```arc
@plugins
architect/plugin-external-tables
```

Then follow the directions below for `@arc-tables` and/or `@other-tables`.

> Note: this plugin currently only supports enables access to tables in the same region. If your app is in `us-west-1`, this plugin will not enable access external tables in `us-east-1`.

---

### `@arc-tables`

These `@arc-tables` pragma identifies tables managed by non-legacy versions (>=6) of Architect. Each entry is a named list, where the name is the `@app` name of the external Architect app, and the list is of tables you'd like to provide access to.

In the following example, resources in the `new-app` Architect app would get access two two external tables:
- The `users` table from the app named `an-existing-arc-app`, and
- The `products` table from the app named `another-existing-arc-app`

```
@app
new-app

@arc-tables
an-existing-arc-app
  users
another-existing-arc-app
  products
```


### `@other-tables`

The `@other-tables` pragma enables access to legacy Architect tables, or an arbitrary number of physical table names. Usage for each:

- Legacy Architect tables
  - These follow convention-based naming, and require a special variable string, like so: `old-app-$arc_stage-users`; this breaks down as follows:
    - `old-app` - the `@app` name of your legacy Arc app
    - `$arc_stage` - a special string used by this plugin to identify the deployment stage (`staging` or `production`) of the table
    - `users` - the `@tables` name of your legacy table
- Physical table names
  - Any arbitrary table name can be used here, e.g. `user-data`
  - Note: physical table names are not to be confused with ARNs; DynamoDB ARNs cannot be used by this plugin


### Table uniqueness

Although tables may have various unique physical names, **each resolved logical table name must be unique across `@tables`, `@arc-tables`, and `@other-tables` when using this plugin**.

If a conflict is found, this plugin will error. For example, you may have the following literal table names:

- `MyAppStaging-UsersTable-ABC123` - a table named `users` managed by the Architect app named `my-app`
- `AnArcAppProduction-UsersTable-DEF456` - a table named `users` managed by another Architect app named `an-arc-app`
- `another-arc-app-staging-users` - a table named `users` originally created by a legacy Architect app named `another-arc-app`
- `users` - a table just named `users` created outside of Architect

Because of how Architect manages automatic service discovery for tables with `@architect/functions` all four of these tables would be in conflict for the logical table name `users` (e.g. `arc.tables().users.get()`).


### Examples

An example providing an Architect app access to the internal table named `products`, and five external tables: `analytics`, `data`, `usage`, `users`, and `user-data`.

```arc
@app
my-app

@tables           # tables managed managed by this Architect app
products
  id *String

@arc-tables       # tables managed by other Arc apps in the same region
an-arc-app        # app name
  analytics       # table names...
  data
another-arc-app   # another app
  usage           # more tables...

@other-tables     # legacy Arc tables and/or tables not managed by Arc
old-app-$arc_stage-users  # legacy Arc table
user-data                 # DynamoDB table not created/managed by Arc
```

This example **would not work** due to [table name uniqueness conflicts](#table-uniqueness) enumerated above:

```arc
@app
broken-tables

@tables           # tables managed managed by this Architect app
products
  id *String

@arc-tables
an-arc-app
  products        # conflicts with @tables products
another-arc-app
  products        # conflicts with @tables products

@other-tables
old-app-$arc_stage-products   # conflicts with @tables products
products                      # conflicts with @tables products
```

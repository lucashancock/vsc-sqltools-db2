import { IBaseQueries, ContextValue } from "@sqltools/types";
import queryFactory from "@sqltools/base-driver/dist/lib/factory";

/** write your queries here go fetch desired data. This queries are just examples copied from SQLite driver */

const describeTable: IBaseQueries["describeTable"] = queryFactory`
  SELECT C.*
  FROM pragma_table_info('${(p) => p.label}') AS C
  ORDER BY C.cid ASC
`;

const fetchColumns: IBaseQueries["fetchColumns"] = queryFactory`
SELECT C.name AS label,
  C.*,
  C.type AS dataType,
  C."notnull" AS isNullable,
  C.pk AS isPk,
  '${ContextValue.COLUMN}' as type
FROM pragma_table_info('${(p) => p.label}') AS C
ORDER BY cid ASC
`;

const fetchRecords: IBaseQueries["fetchRecords"] = queryFactory`
SELECT *
FROM ${(p) => p.table.label || p.table}
LIMIT ${(p) => p.limit || 50}
OFFSET ${(p) => p.offset || 0};
`;

const countRecords: IBaseQueries["countRecords"] = queryFactory`
SELECT count(1) AS total
FROM ${(p) => p.table.label || p.table};
`;

const fetchTables: IBaseQueries["fetchTables"] = queryFactory`
SELECT DISTINCT NAME AS "label", CREATOR as "schema", '${
  ContextValue.TABLE
}' AS "type"
FROM "SYSIBM"."SYSTABLES" where TYPE = 'T' and CREATOR = '${(p) => p.schema}';
`;

const fetchViews: IBaseQueries["fetchTables"] = queryFactory`
SELECT DISTINCT NAME AS "label", CREATOR as "schema", '${
  ContextValue.VIEW
}' AS "type"
FROM "SYSIBM"."SYSTABLES" where TYPE = 'V' and CREATOR = '${(p) => p.schema}';
`;

const fetchSchemas: IBaseQueries["fetchSchemas"] = queryFactory`
  SELECT DISTINCT creator AS "label",
  creator as "schema",
  '${ContextValue.SCHEMA}' as "type",
  'group-by-ref-type' as "iconId"
  FROM "SYSIBM"."SYSTABLES"
`;

// export interface IBaseQueries {
//   fetchRecords: QueryBuilder<{ limit: number; offset: number; table: NSDatabase.ITable; }, any>;
//   countRecords: QueryBuilder<{ table: NSDatabase.ITable; }, { total: number; }>;
//   fetchSchemas?: QueryBuilder<NSDatabase.IDatabase, NSDatabase.ISchema>;
//   fetchTables: QueryBuilder<NSDatabase.ISchema, NSDatabase.ITable>;
//   searchTables: QueryBuilder<{ search: string, limit?: number }, NSDatabase.ITable>;
//   searchColumns: QueryBuilder<{ search: string, tables: NSDatabase.ITable[], limit?: number }, NSDatabase.IColumn>;
//   // old api
//   describeTable: QueryBuilder<NSDatabase.ITable, any>;
//   fetchColumns: QueryBuilder<NSDatabase.ITable, NSDatabase.IColumn>;
//   fetchFunctions?: QueryBuilder<NSDatabase.ISchema, NSDatabase.IFunction>;
//   [id: string]: string | ((params: any) => (string | IExpectedResult));
// }

// const fetchDatabases: IBaseQueries["fetchDatabases"] = queryFactory`
// SELECT name as "label", '${ContextValue.DATABASE}' as "type"
// FROM
// WHERE
// `;

const searchTables: IBaseQueries["searchTables"] = queryFactory`
SELECT name AS label,
  type
FROM sqlite_master
${(p) =>
  p.search ? `WHERE LOWER(name) LIKE '%${p.search.toLowerCase()}%'` : ""}
ORDER BY name
`;
const searchColumns: IBaseQueries["searchColumns"] = queryFactory`
SELECT C.name AS label,
  T.name AS "table",
  C.type AS dataType,
  C."notnull" AS isNullable,
  C.pk AS isPk,
  '${ContextValue.COLUMN}' as type
FROM sqlite_master AS T
LEFT OUTER JOIN pragma_table_info((T.name)) AS C ON 1 = 1
WHERE 1 = 1
${(p) =>
  p.tables.filter((t) => !!t.label).length
    ? `AND LOWER(T.name) IN (${p.tables
        .filter((t) => !!t.label)
        .map((t) => `'${t.label}'`.toLowerCase())
        .join(", ")})`
    : ""}
${(p) =>
  p.search
    ? `AND (
    LOWER(T.name || '.' || C.name) LIKE '%${p.search.toLowerCase()}%'
    OR LOWER(C.name) LIKE '%${p.search.toLowerCase()}%'
  )`
    : ""}
ORDER BY C.name ASC,
  C.cid ASC
LIMIT ${(p) => p.limit || 100}
`;

export default {
  describeTable,
  countRecords,
  fetchColumns,
  fetchRecords,
  fetchTables,
  fetchSchemas,
  fetchViews,
  searchTables,
  searchColumns,
};

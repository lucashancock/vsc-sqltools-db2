import { IBaseQueries, ContextValue } from "@sqltools/types";
import queryFactory from "@sqltools/base-driver/dist/lib/factory";

/** write your queries here go fetch desired data. This queries are just examples copied from SQLite driver */

const describeTable: IBaseQueries["describeTable"] = queryFactory`
  
`;

const fetchColumns: IBaseQueries["fetchColumns"] = queryFactory`
SELECT DISTINCT 
    c.COLNAME AS "label",
    c.TABSCHEMA, 
    c.TABNAME,
    c.COLNO,
    c.KEYSEQ AS "isPk",
    CASE 
        WHEN c.TYPENAME IN ('DATE', 'TIMESTAMP', 'BIGINT', 'SMALLINT')
        THEN c.TYPENAME
        WHEN c.SCALE > 0
        THEN c.TYPENAME || '(' || c.LENGTH || ', ' || c.SCALE || ')'
        WHEN c.SCALE = 0
        THEN c.TYPENAME || '(' || c.LENGTH || ')'
        ELSE c.TYPENAME
    END AS "detail",
    '${ContextValue.COLUMN}' AS "type",
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM "SYSCAT"."REFERENCES" r
            WHERE r.TABNAME = '${(p) => p.label}' 
            AND r.TABSCHEMA = '${(p) => p.schema}' 
            AND INSTR(r.FK_COLNAMES, c.COLNAME) > 0
        )
        THEN 1
        ELSE NULL
    END AS "isFk"
FROM 
    "SYSCAT"."COLUMNS" c
WHERE 
    c.TABNAME = '${(p) => p.label}' 
    AND c.TABSCHEMA = '${(p) => p.schema}' 
ORDER BY 
    c.COLNO;
`;

// const fetchForeignKeys: IBaseQueries["fetchColumns"] = queryFactory`
// SELECT DISTINCT
//     c.COLNAME AS "label",
//     c.TABSCHEMA,
//     c.TABNAME,
//     c.COLNO,
//     c.KEYSEQ AS "isPk",
//     '${ContextValue.COLUMN}' AS "type",
//     1 AS "isFk"
// FROM
//     "SYSCAT"."COLUMNS" c
// WHERE
//     c.TABNAME = '${(p) => p.label}'
//     AND c.TABSCHEMA = 'HDMADMIN'
//     AND EXISTS (
//         SELECT 1
//         FROM "SYSCAT"."REFERENCES" r
//         WHERE r.TABNAME = '${(p) => p.label}'
//         AND r.TABSCHEMA = '${(p) => p.schema}'
//         AND INSTR(r.FK_COLNAMES, c.COLNAME) > 0
//     )
// ORDER BY
//     c.COLNO;
// `;
const fetchForeignKeys: IBaseQueries["fetchColumns"] = queryFactory`
SELECT 
    CONSTNAME as "label", 
    REFTABNAME, 
    FK_COLNAMES, 
    PK_COLNAMES, 
    1 AS "isFk", 
    '${ContextValue.COLUMN}' as "type"
FROM 
    "SYSCAT"."REFERENCES" 
WHERE 
    TABNAME = '${(p) => p.label}' 
    AND TABSCHEMA = '${(p) => p.schema}'

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

// WORKS for now
const fetchTables: IBaseQueries["fetchTables"] = queryFactory`
SELECT DISTINCT NAME AS "label", CREATOR as "schema", '${
  ContextValue.TABLE
}' AS "type"
FROM "SYSIBM"."SYSTABLES" where TYPE = 'T' and CREATOR = '${(p) => p.schema}';
`;

// WORKS for now
const fetchViews: IBaseQueries["fetchTables"] = queryFactory`
SELECT DISTINCT NAME AS "label", CREATOR as "schema", '${
  ContextValue.VIEW
}' AS "type"
FROM "SYSIBM"."SYSTABLES" where TYPE = 'V' and CREATOR = '${(p) => p.schema}';
`;

// WORKS for now
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
  fetchForeignKeys,
  fetchRecords,
  fetchTables,
  fetchSchemas,
  fetchViews,
  searchTables,
  searchColumns,
};

import { IBaseQueries, ContextValue } from "@sqltools/types";
import queryFactory from "@sqltools/base-driver/dist/lib/factory";

/** write your queries here go fetch desired data. This queries are just examples copied from SQLite driver */

const describeTable: IBaseQueries["describeTable"] = queryFactory`
 SELECT 
    colname AS column_name,
    typename AS data_type,
    length AS column_length,
    nulls AS nullable,
    default AS default_value
FROM 
    "SYSCAT"."COLUMNS"
WHERE 
    tabname = '${(p) => p.label}' AND
    tabschema = '${(p) => p.schema}'
ORDER BY 
    colno;
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

const fetchPrimaryKeys: IBaseQueries["fetchColumns"] = queryFactory`
SELECT DISTINCT 
    c.COLNAME AS "label",
    c.TABSCHEMA, 
    c.TABNAME,
    c.COLNO,
    c.KEYSEQ AS "isPk",
    '${ContextValue.COLUMN}' AS "type"
FROM 
    "SYSCAT"."COLUMNS" c
WHERE 
    c.TABNAME = '${(p) => p.label}' 
    AND c.TABSCHEMA = '${(p) => p.schema}' 
    AND c.KEYSEQ IS NOT NULL
ORDER BY 
    c.COLNO;
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
  'package' as "iconId"
  FROM "SYSIBM"."SYSTABLES"
`;

const searchTables: IBaseQueries["searchTables"] = queryFactory`
SELECT 
  tabschema || '.' || tabname AS "label"
FROM 
  "SYSCAT"."TABLES"
${(p) =>
  p.search ? `WHERE LOWER(tabname) LIKE '%${p.search.toLowerCase()}%'` : ""}
ORDER BY 
  tabname;

`;

const searchColumns: IBaseQueries["searchColumns"] = queryFactory`
SELECT T.colname AS "label",
  T.tabname AS "table",
  T.tabschema AS "schema",
  T.typename AS "dataType",
  CASE
    WHEN T.nulls = 'N' THEN FALSE
    ELSE TRUE
  END AS "isNullable",
  T.KEYSEQ AS"isPk", 
  '${ContextValue.COLUMN}' as "type"
FROM "SYSCAT"."COLUMNS" AS T
WHERE tabname = '${(p) => (p.tables.length ? p.tables[0].label : "")}'
AND tabschema = '${(p) => (p.tables.length ? p.tables[0].database : "")}'
ORDER BY T.colname ASC
LIMIT ${(p) => p.limit || 100}
`;

export default {
  describeTable,
  countRecords,
  fetchColumns,
  fetchForeignKeys,
  fetchPrimaryKeys,
  fetchRecords,
  fetchTables,
  fetchSchemas,
  fetchViews,
  searchTables,
  searchColumns,
};

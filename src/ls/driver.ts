import AbstractDriver from "@sqltools/base-driver";
import queries from "./queries";
import {
  IConnectionDriver,
  MConnectionExplorer,
  NSDatabase,
  ContextValue,
  Arg0,
} from "@sqltools/types";
import { v4 as generateId } from "uuid";
import * as db2 from "ibm_db";
import { Database } from "ibm_db";

/**
 * set Driver lib to the type of your connection.
 * Eg for postgres:
 * import { Pool, PoolConfig } from 'pg';
 * ...
 * type DriverLib = Pool;
 * type DriverOptions = PoolConfig;
 *
 * This will give you completions iside of the library
 */
// type Db2Lib = typeof db2.Database;
// type Db2Options = any;

/**
 * MOCKED DB DRIVER
 * THIS IS JUST AN EXAMPLE AND THE LINES BELOW SHOUDL BE REMOVED!
 */
// import fakeDbLib from './mylib'; // this is what you should do
// const fakeDbLib = {
//   open: () => Promise.resolve(fakeDbLib),
//   query: (..._args: any[]) => {
//     const nResults = parseInt((Math.random() * 1000).toFixed(0));
//     const nCols = parseInt((Math.random() * 100).toFixed(0));
//     const colNames = [...new Array(nCols)].map((_, index) => `col${index}`);
//     const generateRow = () => {
//       const row = {};
//       colNames.forEach((c) => {
//         row[c] = Math.random() * 1000;
//       });
//       return row;
//     };
//     const results = [...new Array(nResults)].map(generateRow);
//     return Promise.resolve([results]);
//   },
//   close: () => Promise.resolve(),
// };

/* LINES ABOVE CAN BE REMOVED */

export default class Db2Driver
  extends AbstractDriver<any, any>
  implements IConnectionDriver
{
  /**
   * If you driver depends on node packages, list it below on `deps` prop.
   * It will be installed automatically on first use of your driver.
   */
  public readonly deps: (typeof AbstractDriver.prototype)["deps"] = [
    {
      type: AbstractDriver.CONSTANTS.DEPENDENCY_PACKAGE,
      name: "lodash",
      // version: 'x.x.x',
    },
  ];

  queries = queries;

  /** if you need to require your lib in runtime and then
   * use `this.lib.methodName()` anywhere and vscode will take care of the dependencies
   * to be installed on a cache folder
   **/
  // private get lib() {
  //   return this.requireDep('node-packge-name') as DriverLib;
  // }

  public async open() {
    if (this.connection) {
      return this.connection;
    }

    const db = this.credentials.database;
    const hostname = this.credentials.server;
    const port = this.credentials.port;
    const protocol = "TCPIP";
    const username = this.credentials.username;
    const password = this.credentials.password;
    this.credentials.askForPassword = false;
    const connectionString = `DATABASE=${db};HOSTNAME=${hostname};PORT=${port};PROTOCOL=${protocol};UID=${username};PWD=${password}`;

    const conn = db2.open(connectionString);
    this.connection = conn;
    console.log("OPEN");
    return this.connection;
  }

  public async close() {
    if (!this.connection) return Promise.resolve();

    console.log("CLOSE");
    const conn = await this.connection;
    conn.close();
    this.connection = null;
  }

  public query: (typeof AbstractDriver)["prototype"]["query"] = async (
    queries,
    opt = {}
  ) => {
    // TO-DO: handle non-successful queries
    const db: Database = await this.open();
    console.log("QUERY: ", queries);
    if (typeof queries !== "string") {
      return [
        <NSDatabase.IResult>{
          connId: this.getId(),
          requestId: opt.requestId,
          resultId: generateId(),
          cols: [],
          messages: [
            {
              date: new Date(),
              message: `Query should be of type string`,
            },
          ],
          error: true,
          query: queries.toString(),
          results: [],
        },
      ];
    }
    const rows: any[] = db.querySync(queries);
    console.log(rows);
    if (rows.length === 0) {
      return [
        <NSDatabase.IResult>{
          connId: this.getId(),
          requestId: opt.requestId,
          resultId: generateId(),
          cols: [],
          messages: [
            {
              date: new Date(),
              message: `No results returned.`,
            },
          ],
          query: queries.toString(),
          results: [],
        },
      ];
    }
    const colnames = Object.keys(rows[0]);
    const resultsAgg: NSDatabase.IResult[] = [
      {
        cols: colnames,
        connId: this.getId(),
        messages: [
          {
            date: new Date(),
            message: `Query ok with ${rows.length} results`,
          },
        ],
        results: rows,
        query: queries.toString(),
        requestId: opt.requestId,
        resultId: generateId(),
      },
    ];

    return resultsAgg;
  };

  /** if you need a different way to test your connection, you can set it here.
   * Otherwise by default we open and close the connection only
   */
  public async testConnection() {
    await this.open();
    await this.close();
    // await this.query("SELECT 1", {});
  }

  /**
   * This method is a helper to generate the connection explorer tree.
   * it gets the child items based on current item
   */
  public async getChildrenForItem({
    item,
    parent,
  }: Arg0<IConnectionDriver["getChildrenForItem"]>) {
    switch (item.type) {
      case ContextValue.CONNECTION:
      case ContextValue.CONNECTED_CONNECTION:
        return this.queryResults(this.queries.fetchSchemas());
      case ContextValue.SCHEMA:
        return <MConnectionExplorer.IChildItem[]>[
          {
            label: "Tables",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "folder",
            childType: ContextValue.TABLE,
          },
          {
            label: "Views",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "folder",
            childType: ContextValue.VIEW,
          },
        ];
      case ContextValue.TABLE:
        return <MConnectionExplorer.IChildItem[]>[
          {
            label: "Column",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "folder",
            childType: ContextValue.COLUMN,
          },
          {
            label: "Unique Constraints",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "folder",
            childType: ContextValue.COLUMN,
          },
          {
            label: "Foreign Keys",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "folder",
            childType: ContextValue.COLUMN,
            ind: "fk",
          },
        ];
      case ContextValue.VIEW:
      case ContextValue.COLUMN:
      // return this.queryResults(
      //   this.queries.fetchColumns(item as NSDatabase.ITable)
      // );
      // return this.getColumns(item as NSDatabase.ITable);
      case ContextValue.RESOURCE_GROUP:
        console.log("here2");
        return this.getChildrenForGroup({ item, parent });
    }
    return [];
  }

  /**
   * This method is a helper to generate the connection explorer tree.
   * It gets the child based on child types
   */
  private async getChildrenForGroup({
    parent,
    item,
  }: Arg0<IConnectionDriver["getChildrenForItem"]>) {
    console.log({ item, parent });
    switch (item.childType) {
      case ContextValue.SCHEMA:
        return this.queryResults(
          this.queries.fetchSchemas(parent as NSDatabase.IDatabase)
        );
      case ContextValue.TABLE:
        return this.queryResults(
          this.queries.fetchTables(parent as NSDatabase.ISchema)
        );
      case ContextValue.VIEW:
        return this.queryResults(
          this.queries.fetchViews(parent as NSDatabase.ISchema)
        );
      case ContextValue.COLUMN:
        if (item.label === "Column") {
          return this.getColumns(parent as NSDatabase.ITable, "column");
        }
        if (item.label === "Unique Constraints") {
          return this.getColumns(parent as NSDatabase.ITable, "constraints");
        }
        return this.getColumns(parent as NSDatabase.ITable, "fk");
      case ContextValue.NO_CHILD:
    }
    return [];
  }

  private async getColumns(
    parent: NSDatabase.ITable,
    type: string
  ): Promise<NSDatabase.IColumn[]> {
    if (type === "column") {
      const results = await this.queryResults(
        this.queries.fetchColumns(parent)
      );
      console.log("RES: ", results);
      return results.map((col) => ({
        ...col,
        iconName: col.isPk ? "pk" : col.isFk ? "fk" : null,
        childType: ContextValue.NO_CHILD,
        table: parent,
      }));
    }
    if (type === "constraints") {
      // TO-DO:
      // implement primary key query
      // const results = await this.queryResults(
      //   this.queries.fetchPrimaryKeys(parent)
      // );
      // return results.map((col) => ({
      //   ...col,
      //   iconName: "pk",
      //   childType: ContextValue.NO_CHILD,
      //   table: parent,
      // }));
    }
    const results = await this.queryResults(
      this.queries.fetchForeignKeys(parent)
    );
    return results.map((col) => ({
      ...col,
      iconName: "fk",
      childType: ContextValue.NO_CHILD,
      table: parent,
    }));
  }

  /**
   * This method is a helper for intellisense and quick picks.
   */
  public async searchItems(
    itemType: ContextValue,
    search: string,
    _extraParams: any = {}
  ): Promise<NSDatabase.SearchableItem[]> {
    switch (itemType) {
      case ContextValue.TABLE:
      case ContextValue.VIEW:
        let j = 0;
        return [
          {
            database: "fakedb",
            label: `${search || "table"}${j++}`,
            type: itemType,
            schema: "fakeschema",
            childType: ContextValue.COLUMN,
          },
          {
            database: "fakedb",
            label: `${search || "table"}${j++}`,
            type: itemType,
            schema: "fakeschema",
            childType: ContextValue.COLUMN,
          },
          {
            database: "fakedb",
            label: `${search || "table"}${j++}`,
            type: itemType,
            schema: "fakeschema",
            childType: ContextValue.COLUMN,
          },
        ];
      case ContextValue.COLUMN:
        let i = 0;
        return [
          {
            database: "fakedb",
            label: `${search || "column"}${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: "fakeTable",
          },
          {
            database: "fakedb",
            label: `${search || "column"}${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: "fakeTable",
          },
          {
            database: "fakedb",
            label: `${search || "column"}${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: "fakeTable",
          },
          {
            database: "fakedb",
            label: `${search || "column"}${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: "fakeTable",
          },
          {
            database: "fakedb",
            label: `${search || "column"}${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: "fakeTable",
          },
        ];
    }
    return [];
  }

  public getStaticCompletions: IConnectionDriver["getStaticCompletions"] =
    async () => {
      return {};
    };
}

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
    const db: Database = await this.open();
    console.log("QUERY: ", queries);
    if (typeof queries !== "string") return;
    let queriesResults = [];
    const rows: any[] = db.querySync(queries);
    console.log(rows);
    if (rows.length === 0) return;
    const colnames = Object.keys(rows[0]);
    const resultsAgg: NSDatabase.IResult[] = [
      {
        cols: colnames,
        connId: this.getId(),
        messages: [
          {
            date: new Date(),
            message: `Query ok with ${queriesResults.length} results`,
          },
        ],
        results: rows,
        query: queries.toString(),
        requestId: opt.requestId,
        resultId: generateId(),
      },
    ];

    /**
     * write the method to execute queries here!!
     */
    console.log("Results Agg: ", resultsAgg);
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
        return <NSDatabase.IColumn[]>[
          {
            database: "fakedb",
            label: `schema`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: parent,
          },
        ];
      // case ContextValue.TABLE:
      // case ContextValue.VIEW:
      //   let i = 0;
      //   return <NSDatabase.IColumn[]>[
      //     {
      //       database: "fakedb",
      //       label: `column${i++}`,
      //       type: ContextValue.COLUMN,
      //       dataType: "faketype",
      //       schema: "fakeschema",
      //       childType: ContextValue.NO_CHILD,
      //       isNullable: false,
      //       iconName: "column",
      //       table: parent,
      //     },
      //     {
      //       database: "fakedb",
      //       label: `column${i++}`,
      //       type: ContextValue.COLUMN,
      //       dataType: "faketype",
      //       schema: "fakeschema",
      //       childType: ContextValue.NO_CHILD,
      //       isNullable: false,
      //       iconName: "column",
      //       table: parent,
      //     },
      //     {
      //       database: "fakedb",
      //       label: `column${i++}`,
      //       type: ContextValue.COLUMN,
      //       dataType: "faketype",
      //       schema: "fakeschema",
      //       childType: ContextValue.NO_CHILD,
      //       isNullable: false,
      //       iconName: "column",
      //       table: parent,
      //     },
      //     {
      //       database: "fakedb",
      //       label: `column${i++}`,
      //       type: ContextValue.COLUMN,
      //       dataType: "faketype",
      //       schema: "fakeschema",
      //       childType: ContextValue.NO_CHILD,
      //       isNullable: false,
      //       iconName: "column",
      //       table: parent,
      //     },
      //     {
      //       database: "fakedb",
      //       label: `column${i++}`,
      //       type: ContextValue.COLUMN,
      //       dataType: "faketype",
      //       schema: "fakeschema",
      //       childType: ContextValue.NO_CHILD,
      //       isNullable: false,
      //       iconName: "column",
      //       table: parent,
      //     },
      //   ];
      // case ContextValue.RESOURCE_GROUP:
      //   return this.getChildrenForGroup({ item, parent });
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
    console.log("fun", { item, parent });
    switch (item.childType) {
      case ContextValue.TABLE:
      case ContextValue.VIEW:
        let i = 0;
        return <MConnectionExplorer.IChildItem[]>[
          {
            database: "fakedb",
            label: `${item.childType}${i++}`,
            type: item.childType,
            schema: "fakeschema",
            childType: ContextValue.COLUMN,
          },
          {
            database: "fakedb",
            label: `${item.childType}${i++}`,
            type: item.childType,
            schema: "fakeschema",
            childType: ContextValue.COLUMN,
          },
          {
            database: "fakedb",
            label: `${item.childType}${i++}`,
            type: item.childType,
            schema: "fakeschema",
            childType: ContextValue.COLUMN,
          },
        ];
    }
    return [];
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

import AbstractDriver from "@sqltools/base-driver";
import queries from "./queries";
import {
  IConnectionDriver,
  MConnectionExplorer,
  NSDatabase,
  ContextValue,
  Arg0,
  // IQueryOptions,
  // IExpectedResult,
  // IQueryOptions,
} from "@sqltools/types";
import { v4 as generateId } from "uuid";
import * as db2 from "ibm_db";
import { Database } from "ibm_db";
import keywordsCompletion from "./keywords";

export default class Db2Driver
  extends AbstractDriver<any, any>
  implements IConnectionDriver
{
  public readonly deps: (typeof AbstractDriver.prototype)["deps"] = [
    {
      type: AbstractDriver.CONSTANTS.DEPENDENCY_PACKAGE,
      name: "lodash",
      // version: 'x.x.x',
    },
  ];

  queries = queries;

  public async open() {
    if (this.connection) return this.connection;
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
    return this.connection;
  }

  public async close() {
    if (!this.connection) return Promise.resolve();
    const conn = await this.connection;
    conn.close();
    this.connection = null;
  }

  public query: (typeof AbstractDriver)["prototype"]["query"] = async (
    queries,
    opt = {}
  ) => {
    const db: Database = await this.open();
    const rows: NSDatabase.IResult | NSDatabase.IResult[] = db.querySync(
      queries.toString()
    );
    if (rows.length === 0 || rows.error)
      return [
        <NSDatabase.IResult>{
          connId: this.getId(),
          requestId: opt.requestId,
          resultId: generateId(),
          cols: ["Error"],
          messages: [
            {
              date: new Date(),
              message: `No results returned or invalid query`,
            },
          ],
          query: queries.toString(),
          results: [{ Error: rows.error ? rows.message : "No query results." }],
        },
      ];
    const colnames = Object.keys(rows[0]);
    return [
      <NSDatabase.IResult>{
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
  };

  public async testConnection() {
    await this.open();
    await this.close();
  }
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
            iconId: "menu",
            childType: ContextValue.COLUMN,
          },
          {
            label: "Unique Constraints",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "references",
            childType: ContextValue.COLUMN,
          },
          {
            label: "Foreign Keys",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "references",
            childType: ContextValue.COLUMN,
            ind: "fk",
          },
        ];
      case ContextValue.VIEW:
      case ContextValue.COLUMN:
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
      const results = await this.queryResults(
        this.queries.fetchPrimaryKeys(parent)
      );
      return results.map((col) => ({
        ...col,
        iconName: "pk",
        childType: ContextValue.NO_CHILD,
        table: parent,
      }));
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
    extraParams: any = {}
  ): Promise<NSDatabase.SearchableItem[]> {
    console.log("EXTRA: ", extraParams);
    switch (itemType) {
      case ContextValue.TABLE:
      case ContextValue.VIEW:
        return this.queryResults(this.queries.searchTables({ search: search }));
      case ContextValue.COLUMN:
        return this.queryResults(
          this.queries.searchColumns({ search, ...extraParams })
        );
    }
    return [];
  }

  private completionsCache: { [w: string]: NSDatabase.IStaticCompletion } =
    null;
  public getStaticCompletions = async () => {
    if (this.completionsCache) return this.completionsCache;
    // use default reserved words
    this.completionsCache = keywordsCompletion;

    return this.completionsCache;
  };
}

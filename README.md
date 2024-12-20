# DB2 Driver for SQLTools

## About

This is an extension which uses ibm-db library to integrate DB2 connection and query functionality into SQLTools.

It is created and maintained by Lucas Hancock (lucas.hancock18@gmail.com)

## Dev Environment & Testing

1. Clone the repo
2. Go to the repo directory
3. Run `npm i` to install dependencies
4. Run `npm run compile` to compile the extension
5. Press `F5` to run the dev environment and test the extension

## Instructions

- Once the extension is installed from VS Code Marketplace, click on it in the navigation view.
- Add a new connection using the add connection button.
- Connect to a connection using the connection button.
- Disconnect using the disconnect button
- Once connected, use the tree explorer view to explore the database connection.
- Create .SQL files and execute SQL queries on the fly.

## Important notes

- The extension currently does not support `DESCRIBE`.
- The extension _should_ support INSERT and CREATE, but these use cases were not extensively tested yet. `SELECT` statements should work very well.

## Contact

For any questions, email the developer(s) below:

- Lucas Hancock (lucas.hancock18@gmail.com)

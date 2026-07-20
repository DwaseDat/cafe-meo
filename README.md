# Mochi & Brew — Coffee Cat Shop (SQL Server version)

Two websites sharing ONE SQL Server database:
- **Customer site** → http://localhost:3000
- **Manager/Staff site** → http://localhost:4000

## 1. Run the schema in SSMS
Open `schema.sql` in SQL Server Management Studio and click **Execute**.
It will:
- Create the `coffee_cat_shop` database
- Create all tables (`staff`, `customer`, `reservation`, `order`, `menu`, `order_item`, `breed`, `cat`)
- Insert sample data, including a manager login: `admin` / `admin123`

If you get an error that the database already exists, just delete the first
`CREATE DATABASE coffee_cat_shop; GO` block and re-run.

## 2. Enable SQL Server authentication (if not already)
Node connects using a SQL login (username/password), not just Windows auth, by default in this project.
- In SSMS: right-click your server → **Properties** → **Security** → select **SQL Server and Windows Authentication mode**.
- Restart the SQL Server service after changing this.
- Create a login: right-click **Security → Logins → New Login**, set a username/password, and under **User Mapping** give it access to `coffee_cat_shop` with `db_owner` role.

(Alternative: keep Windows Authentication — see the commented-out config block inside `db.js` and install `msnodesqlv8` instead.)

## 3. Enable TCP/IP (so Node can reach SQL Server)
- Open **SQL Server Configuration Manager** → **SQL Server Network Configuration** → **Protocols for [your instance]** → enable **TCP/IP**.
- Restart the SQL Server service.
- Note your instance name (visible in SSMS connection, e.g. `DWASE\CE201135`) — you'll need it in `db.js`.

## 4. Configure the connection
Open `db.js` and edit:
```js
const config = {
  server: 'localhost',        // or 'DWASE\\CE201135' if using a named instance
  database: 'coffee_cat_shop',
  user: 'sa',
  password: 'YourPassword',
  options: { encrypt: false, trustServerCertificate: true },
  port: 1433
};
```

## 5. Install dependencies and run
```
npm install
npm run customer    # Terminal 1 → http://localhost:3000
npm run manager      # Terminal 2 → http://localhost:4000
```

## Project structure
```
coffee-cat-shop-mssql/
├── schema.sql               # run in SSMS to set up SQL Server database
├── db.js                    # shared connection pool (both sites use this)
├── customer-server.js       # Express server, port 3000
├── manager-server.js        # Express server, port 4000
├── routes/
│   ├── customerRoutes.js    # uses mssql parameterized queries
│   └── managerRoutes.js
├── customer-public/         # HTML/CSS/JS for customer website (unchanged)
└── manager-public/          # HTML/CSS/JS for manager website (unchanged)
```

The frontend (HTML/CSS/JS in `customer-public` and `manager-public`) is identical
to the MySQL version — only the backend database layer changed.

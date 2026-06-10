# Lost & Found Backend API

Backend server for the Lost & Found University Portal built with Express.js and MySQL.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
- Open MySQL and run the SQL script:
```bash
mysql -u root < db/db.sql
```
Or paste the contents of `db/db.sql` in your MySQL client.

### 3. Configure Environment Variables
- Copy `.env.example` to `.env`
- Update the database credentials in `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lost_and_found
DB_PORT=3306
PORT=5000
```

### 4. Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## Available Endpoints

- `GET /api/health` - Server health check
- `GET /api/db-test` - Test database connection
- `GET /api/users` - Get all users
- `GET /api/items` - Get all items

## Folder Structure
```
backend/
├── db/
│   ├── connection.js   - Database connection pool
│   └── db.sql          - SQL schema file
├── server.js           - Main Express server
├── package.json        - Dependencies
├── .env                - Environment variables (create from .env.example)
├── .env.example        - Environment template
└── .gitignore          - Git ignore rules
```

## Next Steps
Ready to add API routes for:
- User authentication (login/signup)
- Item CRUD operations
- Claims management
- Notifications

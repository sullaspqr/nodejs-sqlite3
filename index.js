const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const PORT = 3000;
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite");

// Swagger konfiguráció
const swaggerOptions = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'Node.js - SQLite3 API',
        version: '1.0.0',
        description: 'Node.JS - SQLite3 API dokumentáció',
      },
      servers: [
        {
          url: 'http://localhost:3000',
        },
      ],
    components: {
        schemas: {
          users: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                example: 1,
              },
              name: {
                type: 'string',
                example: 'John Doe',
              },
              email: {
                type: 'string',
                example: 'johndoe@example.com',
              },
            },
          },
        },
      },
    },
    apis: ['./index.js'], // Ide írhatod a specifikációt tartalmazó fájlok elérési útját
  };
  
  const swaggerDocs = swaggerJsdoc(swaggerOptions);
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // A végpont a /swagger lett
  
let users = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
  },
  {
    id: "3",
    name: "Sam Johnson",
    email: "sam.johnson@example.com",
  },
];

db.serialize(() => {
  db.run("DROP TABLE IF EXISTS users");
  db.run(
    "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)"
  );

  for (const i of users) {
    db.run("INSERT INTO users (name, email) VALUES (?, ?)", [i.name, i.email]);
  }
});

app.use(express.json());
// Felhasználók lekérdezése végpont
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Felhasználók listájának lekérdezése
 *     responses:
 *       200:
 *         description: A felhasználók listája
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/users'
 */
app.get("/users", (req, res) => {
  db.all("SELECT * FROM users", (err, users) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    res.json(users);
  });
});

// Felhasználó lekérdezése ID alapján (GET /users/:id)
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Felhasználó lekérdezése az ID alapján
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Felhasználó azonosítója
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: A felhasználó adatai
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/users'
 *       404:
 *         description: Felhasználó nem található
 */
app.get("/users/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  });
});
// 2. POST egy új felhasználó létrehozására (POST /users)
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Új felhasználó létrehozása
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/users'
 *     responses:
 *       201:
 *         description: Felhasználó sikeresen létrehozva
 *       400:
 *         description: Hibás kérés
 */
app.post("/users", (req, res) => {
  db.run(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    [req.body.name, req.body.email],
    function (err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      res.status(201).json({ ...req.body, id: this.lastID });
    }
  );
});

// 3. PUT egy felhasználó frissítésére (PUT /users/:id)
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Felhasználó frissítése az ID alapján
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Felhasználó azonosítója
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/users'
 *     responses:
 *       200:
 *         description: A felhasználó sikeresen frissítve
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/users'
 *       404:
 *         description: Felhasználó nem található
 */
app.put("/users/:id", (req, res) => {
  const id = req.params.id;

  db.run(
    "UPDATE users SET name = ?, email = ? WHERE id = ?",
    [req.body.name, req.body.email, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      res.json({ ...req.body, id: Number(id) });
    }
  );
});
// 4. DELETE egy felhasználó törlésére (DELETE /users/:id)
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Felhasználó törlése az ID alapján
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Felhasználó azonosítója
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Felhasználó sikeresen törölve
 *       404:
 *         description: Felhasználó nem található
 */
app.delete("/users/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    res.sendStatus(204);
  });
});

app.listen(3000, () => console.log("The app is running on port 3000!"));
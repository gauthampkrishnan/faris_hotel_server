const express = require("express");
const cors = require("cors");
const app = express();
var mysql = require('mysql');

app.use(cors());
app.use(express.json());



// Create a connection pool
const pool = mysql.createPool({
    connectionLimit: 10,
    host: "srv765.hstgr.io",
    user: "u822847348_hotel_website",
    password: "OneTwoThree123.",
    database: "u822847348_hotel"
});

app.get("/dishes/:menu", (req, res) => {
    let query = req.params.menu;

    // Get a connection from the pool
    pool.getConnection((err, con) => {
        if (err) {
            console.error('Error getting a database connection:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Use the connection to execute the query
        con.query("SELECT * FROM DATA_FORMAT WHERE MENU=?", [query], function (err, result, fields) {
            con.release(); // Release the connection back to the pool

            if (err) {
                console.error('Error executing the query:', err.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            console.log(result);
            res.json({ result });
        });
    });
});


app.listen(8000, () => {
    console.log(`Server is running on port 8000.`);
});
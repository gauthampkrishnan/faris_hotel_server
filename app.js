const express = require("express");
const cors = require("cors");
const app = express();
var mysql = require('mysql');

const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');


app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
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
        console.log(query)
        con.query("SELECT * FROM DATA_FORMAT WHERE MENU=?", [query], function (err, result) {
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

app.post('/generate-pdf', (req, res) => {
    const data = req.body; // Your JSON data from the client
  
    // Create a document
    const doc = new PDFDocument();
  
    // Setup the response for streaming the PDF
    res.setHeader('Content-disposition', 'attachment; filename="itinerary.pdf"');
    res.setHeader('Content-type', 'application/pdf');
    
    // Pipe the PDF into the response
    doc.pipe(res);

    // Add a title to the PDF, centered
    doc.fontSize(18) // Set a title-size font
       .text('Itinerary', {
         align: 'center'
       });

    // Add a little bit of space after the header
    doc.moveDown(2.0); // Move down twice the default line height to add space

    // Set the font size back to normal for the rest of the text
    doc.fontSize(12);

    // Function to handle nested objects and arrays, excluding 'id' fields
    const formatValue = (value) => {
        if (Array.isArray(value)) {
            return value.map(formatValue).join(', ');
        } else if (typeof value === 'object' && value !== null) {
            return Object.entries(value)
                         .filter(([k, _]) => k !== 'id') // Exclude 'id' key
                         .map(([k, v]) => `${k}: ${formatValue(v)}`)
                         .join(', ');
        } else {
            return String(value); // Convert value to string
        }
    };

    // Add the text from JSON to the PDF, handle nested objects and arrays
    for (const [key, value] of Object.entries(data)) {
        if (key !== 'id') { // Also exclude 'id' at the root level
            const formattedValue = formatValue(value);
            doc.text(`${key}: ${formattedValue}`, {
                width: 410,
                align: 'left'
            });
            doc.moveDown();
        }
    }
  
    // Finalize the PDF and end the stream
    doc.end();
});

const PORT = process.env.PORT || 8000; 

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
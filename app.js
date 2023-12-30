const express = require("express");
const cors = require("cors");
const app = express();
var mysql = require('mysql');

const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');



app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use(bodyParser.json());
let transporter = nodemailer.createTransport({
    host: 'smtp.titan.email', // The Titan SMTP server address
    port: 587, // The standard SMTP port
    secure: false, // True for 465, false for other ports like 587
    auth: {
        user: 'gautham@gauthampremkrishnan.com', // Your Titan email address
        pass: 'Casper.12345678' // Your Titan email password
    },
    tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
    }
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
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
            res.json({ result });
        });
    });
});
let totalValue =0
function formatOrderDetails(order) {
    let formattedDishes = order.dishes.map(dish =>
        `  ${dish.quantity} x ${dish.Dish} at $${dish.Cost} each`
    ).join('\n');

    let totalCost = order.dishes.reduce((acc, dish) => acc + (dish.quantity * dish.Cost), 0);
    totalValue=totalCost

    return `
Order Confirmation
-------------------

Order Details:
  Name: ${order.name || 'N/A'}
  Email: ${order.email || 'N/A'}
  Phone Number: ${order.phoneNumber || 'N/A'}
  Event Types: ${order.eventTypes || 'N/A'}
  Event Location: ${order.eventLocation || 'N/A'}
  Birthday: ${order.birthday || 'N/A'}
  Planned Budget: $${order.plannedBudget || 'N/A'}
  Event Phone: ${order.eventPhone || 'N/A'}
  Per Head: ${order.perHead ? 'Yes' : 'No'}
  Per Head Count: ${order.perHeadCount || 'N/A'}
  Time: ${order.time || 'N/A'}
  Cart Items: ${order.cartItems || 'N/A'}

Dishes Ordered:
${formattedDishes}

Total Cost: $${totalCost}
`.trim();
}




app.post('/send-email', async (req, res) => {
    const orderData = req.body;

    let mailOptions = {
        from: 'gautham@gauthampremkrishnan.com',
        to: 'gauthamkrishnanp@gmail.com', // Replace with the customer's email address
        subject: 'Order Confirmation',
        text: formatOrderDetails(orderData), // Plain text version of the email
        html: `
          <h1>Order Confirmation</h1>
          <h2>Order Details:</h2>
          <p>Name: ${orderData.name || 'N/A'}</p>
          <p>Email: ${orderData.email || 'N/A'}</p>
          <p>Phone Number: ${orderData.phoneNumber || 'N/A'}</p>
          <p>Event Types: ${orderData.eventTypes || 'N/A'}</p>
          <p>Event Location: ${orderData.eventLocation || 'N/A'}</p>
          <p>Date: ${orderData.birthday || 'N/A'}</p>
          <p>Planned Budget: $${orderData.plannedBudget || 'N/A'}</p>
          <p>Event Phone: ${orderData.eventPhone || 'N/A'}</p>
          <p>Per Head: ${orderData.perHead }</p>
          <p>Per Head Count: ${orderData.perHeadCount || 'N/A'}</p>
          <p>Time: ${orderData.time || 'N/A'}</p>
          <h2>Dishes Ordered:</h2>
          <ul>
            ${orderData.dishes.map(dish => `<li>${dish.quantity} x ${dish.Dish} at $${dish.Cost} each</li>`).join('')}
          </ul>
          <p>Total Cost: $${totalValue}</p>
        `, // HTML version of the email
      };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).send({ message: 'Error sending email', error: error });
        }
        res.status(200).send({ message: 'Email sent', messageId: info.messageId });
    });
});



// app.post('/generate-pdf', (req, res) => {
//     const data = req.body; // Your JSON data from the client
  
//     // Create a document
//     const doc = new PDFDocument();
  
//     // Setup the response for streaming the PDF
//     res.setHeader('Content-disposition', 'attachment; filename="itinerary.pdf"');
//     res.setHeader('Content-type', 'application/pdf');
    
//     // Pipe the PDF into the response
//     doc.pipe(res);

//     // Add a title to the PDF, centered
//     doc.fontSize(18) // Set a title-size font
//        .text('Itinerary', {
//          align: 'center'
//        });

//     // Add a little bit of space after the header
//     doc.moveDown(2.0); // Move down twice the default line height to add space

//     // Set the font size back to normal for the rest of the text
//     doc.fontSize(12);

//     // Function to handle nested objects and arrays, excluding 'id' fields
//     const formatValue = (value) => {
//         if (Array.isArray(value)) {
//             return value.map(formatValue).join(', ');
//         } else if (typeof value === 'object' && value !== null) {
//             return Object.entries(value)
//                          .filter(([k, _]) => k !== 'id') // Exclude 'id' key
//                          .map(([k, v]) => `${k}: ${formatValue(v)}`)
//                          .join(', ');
//         } else {
//             return String(value); // Convert value to string
//         }
//     };

//     // Add the text from JSON to the PDF, handle nested objects and arrays
//     for (const [key, value] of Object.entries(data)) {
//         if (key !== 'id') { // Also exclude 'id' at the root level
//             const formattedValue = formatValue(value);
//             doc.text(`${key}: ${formattedValue}`, {
//                 width: 410,
//                 align: 'left'
//             });
//             doc.moveDown();
//         }
//     }
  
//     // Finalize the PDF and end the stream
//     doc.end();
// });

const PORT = process.env.PORT || 8000; 

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

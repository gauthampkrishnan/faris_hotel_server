const express = require("express");
const cors = require("cors");
const app = express();
var mysql = require("mysql");

const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const nodemailer = require("nodemailer");
const util = require("util");
const stream = require("stream");

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use(bodyParser.json());
let transporter = nodemailer.createTransport({
  host: "smtp.titan.email", // The Titan SMTP server address
  port: 587, // The standard SMTP port
  secure: false, // True for 465, false for other ports like 587
  auth: {
    user: "gautham@gauthampremkrishnan.com", // Your Titan email address
    pass: "Casper.12345678", // Your Titan email password
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
// Create a connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: "srv765.hstgr.io",
  user: "u822847348_hotel_website",
  password: "OneTwoThree123.",
  database: "u822847348_hotel",
});

const insertIntoDBhistory = (param1, param2, param3) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, con) => {
            if (err) {
                console.error("Error getting a database connection:", err.message);
                reject(err); // Reject the promise with the error
            } else {
                con.query(
                    "INSERT INTO DishHistory (Name, Email, PhoneNo) VALUES (?, ?, ?)",
                    [param1, param2, param3],
                    function (err, result) {
                        con.release(); // Release the connection back to the pool

                        if (err) {
                            console.error("Error executing the INSERT query:", err.message);
                            reject(err); // Reject the promise with the error
                        } else {
                            // Query for the last inserted ID
                            con.query(
                                "SELECT LAST_INSERT_ID() AS LastInsertID",
                                function (err, rows) {
                                    if (err) {
                                        console.error("Error executing the SELECT query:", err.message);
                                        reject(err); // Reject the promise with the error
                                    } else {
                                        const lastInsertID = rows[0].LastInsertID;
                                        resolve(lastInsertID); // Resolve the promise with the last insert ID
                                    }
                                }
                            );
                        }
                    }
                );
            }
        });
    });
};

const getUniqueOrderId = ()=>{
    pool.getConnection((err, con) => {
        if (err) {
            console.error("Error getting a database connection:", err.message);
            callback(err, null); // Pass the error to the callback
        } else {
            con.query(
                "INSERT INTO DishHistory (Name, Email, PhoneNo) VALUES (?, ?, ?)",
                [param1, param2, param3],
                function (err, result) {
                    if (err) {
                        console.error("Error executing the INSERT query:", err.message);
                        callback(err, null); // Pass the error to the callback
                    } else {
                        con.query(
                            "SELECT LAST_INSERT_ID() AS LastInsertID",
                            function (err, rows) {
                                con.release(); // Release the connection back to the pool
            
                                if (err) {
                                    console.error("Error executing the SELECT query:", err.message);
                                    callback(err, null); // Pass the error to the callback
                                } else {
                                    const lastInsertID = rows[0].LastInsertID;
                                    callback(null, lastInsertID); // Pass the last insert ID to the callback
                                }
                            }
                        );
                    }
                }
            );
        }
    });
}



app.get("/dishes/:menu", (req, res) => {
  let query = req.params.menu;

  // Get a connection from the pool
  pool.getConnection((err, con) => {
    if (err) {
      console.error("Error getting a database connection:", err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Use the connection to execute the query
    console.log(query);
    con.query(
      "SELECT * FROM DATA_FORMAT WHERE MENU=?",
      [query],
      function (err, result) {
        con.release(); // Release the connection back to the pool

        if (err) {
          console.error("Error executing the query:", err.message);
          return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json({ result });
      }
    );
  });
});
let totalValue = 0;
function formatOrderDetails(order) {
  let formattedDishes = order.dishes
    .map((dish) => `  ${dish.quantity} x ${dish.Dish} at $${dish.Cost} each`)
    .join("\n");

  let totalCost = order.dishes.reduce(
    (acc, dish) => acc + dish.quantity * dish.Cost,
    0
  );
  totalValue = totalCost;

  return `
Order Confirmation
-------------------

Order Details:
  Name: ${order.name || "N/A"}
  Email: ${order.email || "N/A"}
  Phone Number: ${order.phoneNumber || "N/A"}
  Event Types: ${order.eventTypes || "N/A"}
  Event Location: ${order.eventLocation || "N/A"}
  Birthday: ${order.birthday || "N/A"}
  Planned Budget: $${order.plannedBudget || "N/A"}
  Event Phone: ${order.eventPhone || "N/A"}
  Per Head: ${order.perHead ? "Yes" : "No"}
  Per Head Count: ${order.perHeadCount || "N/A"}
  Time: ${order.time || "N/A"}
  Cart Items: ${order.cartItems || "N/A"}

Dishes Ordered:
${formattedDishes}

Total Cost: $${totalCost}
`.trim();
}

const finished = util.promisify(stream.finished);
const text = "ff";
let currentDate = new Date().toJSON().slice(0, 10);
app.post("/send-email", async (req, res) => {
   


  const orderData = req.body;

  const uniqueIdvalue = await insertIntoDBhistory(orderData.name, orderData.email, orderData.phoneNumber, (err, result) => {
    if (err) {
        // Handle the error here
        console.error("Error:", err);
    } else {
        // Handle the result here
        console.log("Result:", result);
    }
});



  const pdfDoc = new PDFDocument();
  const pdfFilename = "OrderDetails.pdf";
  const fileStream = fs.createWriteStream(pdfFilename);
  pdfDoc.pipe(fileStream);
  // Invoice Header
  pdfDoc
    .fontSize(25)
    .font("Helvetica-Bold")
    .text("INVOICE", { align: "left" })
    .fontSize(10)
    .text("Sitar Indian Cuisine", { align: "left" })
    .text("3630 Durham-Chapel Hill Blvd", { align: "left" })
    .text("Durham", { align: "left" })
    .text("NC 27707")
    .moveDown(2)

    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Bill to: " + orderData.name, { align: "left" })
    .text("Email" + orderData.email, { align: "left" })
    .text("Phone" + orderData.phoneNumber);

  // Invoice Information
  pdfDoc
    .fontSize(10)
    .font("Helvetica")
    .text("INVOICE #" + uniqueIdvalue , 400)
    .text("INVOICE DATE: " + currentDate, 400);

  pdfDoc.moveDown();

  // Table Headers
  const tableTop = 250;
  pdfDoc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("QTY", 50, tableTop)
    .text("DESCRIPTION", 200, tableTop)
    .text("PRICE", 350, tableTop, { width: 90, align: "right" })
    .text("AMOUNT", 0, tableTop, { align: "right" });

  // Draw lines for the table
  pdfDoc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke();

  const itemsPerPage = 15; // Adjust this number as needed
  const items = orderData.dishes; // Your array of items
  let i = 0;
  let yPosition = tableTop;

  items.forEach((item) => {
    if (i > 0 && i % itemsPerPage === 0) {
      // Start a new page if the item count exceeds itemsPerPage
      pdfDoc.addPage();
      yPosition = tableTop;
    }

    yPosition = tableTop + 25 + (i % itemsPerPage) * 20;

    pdfDoc
      .fontSize(10)
      .font("Helvetica")
      .text(item.quantity, 50, yPosition)
      .text(item.Dish, 200, yPosition)
      .text(item.Cost.toFixed(2), 350, yPosition, { width: 90, align: "right" })
      .text((item.quantity * item.Cost).toFixed(2), 0, yPosition, {
        align: "right",
      });

    i++;
  });
  pdfDoc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, yPosition + 15)
    .lineTo(550, yPosition + 15)
    .stroke();

  pdfDoc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("TOTAL", 350, yPosition + 60, { width: 90, align: "right" })
    .text(orderData.Total.toFixed(2), 0, yPosition + 60, { align: "right" });

  pdfDoc.end();

  try {
    await finished(fileStream);
    let mailOptions = {
      from: "gautham@gauthampremkrishnan.com",
      to: "gauthamkrishnanp@gmail.com",
      subject: "Order Confirmation",
      text: formatOrderDetails(orderData),
      html: `
            <h1>Order Confirmation</h1>
            <h2>Order Details:</h2>
            <p>Name: ${orderData.name || "N/A"}</p>
            <p>Email: ${orderData.email || "N/A"}</p>
            <p>Phone Number: ${orderData.phoneNumber || "N/A"}</p>
            <p>Event Types: ${orderData.eventTypes || "N/A"}</p>
            <p>Event Location: ${orderData.eventLocation || "N/A"}</p>
            <p>Date: ${orderData.birthday || "N/A"}</p>
            <p>Planned Budget: $${orderData.plannedBudget || "N/A"}</p>
            <p>Event Phone: ${orderData.eventPhone || "N/A"}</p>
            <p>Per Head: ${orderData.perHead}</p>
            <p>Per Head Count: ${orderData.perHeadCount || "N/A"}</p>
            <p>Time: ${orderData.time || "N/A"}</p>
            <h2>Dishes Ordered:</h2>
            <ul>
              ${orderData.dishes
                .map(
                  (dish) =>
                    `<li>${dish.quantity} x ${dish.Dish} at $${dish.Cost} each</li>`
                )
                .join("")}
            </ul>
            <p>Total Cost: $${totalValue}</p>
          `, // HTML version of the email

      attachments: [
        {
          filename: pdfFilename,
          path: "./" + pdfFilename,
        },
      ],
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res
          .status(500)
          .send({ message: "Error sending email", error: error });
      }
      fs.unlinkSync(pdfFilename);
      res
        .status(200)
        .send({ message: "Email sent", messageId: info.messageId });
    });
  } catch (err) {
    console.log("Error", err);
  }
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

const express = require("express");
const cors = require("cors");
const qrcode = require("qrcode");

const app = express();
app.use(cors());

const cache = {};
// Cache alive 5 min (300000 ms)
const cacheExpiry = 300000;

app.get("/qrcode", async (req, res) => {
  const text = req.query.text;
  console.log(`Received request: ${text}`);

  if (!text) {
    console.log('Parameter "text" is missing');
    return res.status(400).send('Parameter "text" is missing');
  }

  // Check if the QR code for this text is already cached
  if (cache[text] && (Date.now() - cache[text].timestamp) <= cacheExpiry) {
    console.log("Retrieving from cache");
    return res.setHeader("Content-Type", "image/png").send(cache[text].buffer);
  } else if(cache[text] && (Date.now() - cache[text].timestamp) > cacheExpiry) {
    delete cache[text];
  }

  try {
    // Create a QR code and convert it to a data URL
    const qrCodeDataURL = await qrcode.toDataURL(text);

    // Set the content type to image/png
    res.setHeader("Content-Type", "image/png");

    // Convert data URL to buffer and send
    const base64Data = qrCodeDataURL.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    // Cache the generated QR code
    cache[text] = {
      buffer: buffer,
      timestamp: Date.now(), // เก็บเวลาที่รายการถูกจัดเก็บ
    };

    res.send(buffer);
  } catch (error) {
    console.log(`Error generating QR code: ${error}`);
    res.status(500).send("Error generating QR code");
  }
});

// จำกัดขนาดการร้องขอสูงสุดเป็น 1MB
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(
    `Server running at http://localhost:${PORT}/qrcode?text="ข้อความที่ต้องการ"`
  );
});

const https = require('https');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const qrcode = require('qrcode');
const path = require('path');

const https_options = {
    key: fs.readFileSync(path.join(__dirname, 'private-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certificate.crt'))
};

const app = express();

// Use CORS middleware with specific origin
app.use(cors({
    origin: '*'
}));


const cache = {};
app.get('/qrcode', async (req, res) => {
    const text = req.query.text;
    console.log('Received request',text);
    if (!text) {
        res.status(400).send('Parameter "text" is missing');
        return;
    }
    // Check if the QR code for this text is already cached
    if (cache[text]) {
        console.log('Retrieving from cache');
        res.setHeader('Content-Type', 'image/png');
        res.send(cache[text]);
        return;
    }

    try {
        // Create a QR code and convert it to a data URL
        const qrCodeDataURL = await qrcode.toDataURL(text);
        // console.log(qrCodeDataURL)
        
        // Set the content type to image/png
        res.setHeader('Content-Type', 'image/png');
        // Send the QR code image data as a response
        // Convert data URL to buffer and send
        const base64Data = qrCodeDataURL.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        // Cache the generated QR code
        cache[text] = buffer;

        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating QR code');
    }
});

const PORT = 443;
const server = https.createServer(https_options, app);

server.listen(PORT, () => {
    console.log(`Server running at https://localhost:${PORT}/qrcode?text="ข้อความที่ต้องการ"`);
});

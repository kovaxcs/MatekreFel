const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdf-lib').PDFDocument;
const app = express();
app.use(express.text({type: '*/*', limit: '10mb'})); // receive raw HTML

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.options('/generate-pdf', cors({
  origin: '*'
}));

app.use(cors({
  origin: '*'
}));

app.get('/', async (req, res) => { 
  console.log('get /');
  res.send("Rest");
});

app.post('/generate-pdf', async (req, res) => {
  console.log('generate-pdf post')
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', true);
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  const url = req.body;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
	
  // Load your HTML and wait for assets
  await page.goto(url, { waitUntil: 'networkidle0' });

  await page.waitForSelector('.ML__math', {timeout: 5000}).catch(() => {
    console.warn("MathLive render element not detected; continuing anyway.");
  });

  // Generate PDF
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  pdfDoc.setTitle('Matekre fel! Teszt');
  pdfDoc.setAuthor('Matekre fel!');
  const updatedPdfBytes = await pdfDoc.save();

  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'inline; filename="document.pdf"',
    "Content-Length": updatedPdfBytes.length,
  });
  res.end(updatedPdfBytes);
});

app.listen(3000, () => console.log('API running on port 3000'));

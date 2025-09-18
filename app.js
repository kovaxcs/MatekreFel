const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
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
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  //const html = '<html><body><h1>Hello, world!</h1><p>This is a test PDF document.</p></body></html>';

  await page.goto('https://staging.matekrefel.ro/test2', { waitUntil: 'networkidle0' });
  // Load your HTML and wait for assets
  //await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.waitForSelector('.ML__math', {timeout: 5000}).catch(() => {
    console.warn("MathLive render element not detected; continuing anyway.");
  });

  await page.waitForFunction(() => {
	return document.querySelector("#footer") !== null;
  });
  // Generate PDF
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  //res.set({'Content-Type': 'application/pdf'});
  //res.send(pdfBuffer);

  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'inline; filename="document.pdf"',
    "Content-Length": pdfBuffer.length,
  });
  res.end(pdfBuffer);
});

app.post('/generate-pdf', async (req, res) => {
  console.log('generate-pdf post')
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', true);
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  const html = req.body;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
	
  // Load your HTML and wait for assets
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.waitForSelector('.ML__math', {timeout: 5000}).catch(() => {
    console.warn("MathLive render element not detected; continuing anyway.");
  });

  // Generate PDF
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'inline; filename="document.pdf"',
    "Content-Length": pdfBuffer.length,
  });
  res.end(pdfBuffer);
});

app.listen(3000, () => console.log('API running on port 3000'));

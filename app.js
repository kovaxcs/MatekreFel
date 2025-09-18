const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.text({type: '*/*', limit: '10mb'})); // receive raw HTML

app.use(cors({
  origin: '*' // or use '*' to allow all, but for security, specify your staging/production URLs
}));

app.get('/', (req, res) => { 
  res.send("Teszt2");
});

app.post('/generate-pdf', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', true);
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  const html = req.body;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Load your HTML and wait for assets
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Wait for MathJax if you have LaTeX. Optionally, wait for a JS flag set after rendering:
  await page.waitForFunction('window.MathJax && MathJax.typesetPromise', {timeout: 5000}).catch(()=>{});
  await page.evaluate(() => { if(window.MathJax) { return window.MathJax.typesetPromise(); } });

  // Generate PDF
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  res.set({'Content-Type': 'application/pdf'});
  res.send(pdfBuffer);
});

app.listen(3000, () => console.log('API running on port 3000'));

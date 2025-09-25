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
  	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Credentials', true);
	res.set('Access-Control-Allow-Methods', 'GET');
	res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	
	let ngc_cert = req.query.cert;
	if(ngc_cert){
	
		const URL = "https://www.ngccoin.com/certlookup/"+ngc_cert+"/";
		const BROWSER_WS = "wss://brd-customer-hl_984bd47d-zone-scraping_browser2:as5o1uo4mf7m@brd.superproxy.io:9222";
	
		run(URL);
	
		async function run(url) {
		console.log("Connecting to browser...");
		const browser = await puppeteer.connect({
			browserWSEndpoint: BROWSER_WS,
		});
		console.log("Connected! Navigate to site...");
		const page = await browser.newPage();
		await page.goto(url, { waitUntil: "domcontentloaded", timeout: 80000 });
		console.log("Navigated! Waiting for popup...");
		await close_popup(page);
		console.log("Parsing data...");
	
		const inGrade = await page.evaluate(() => {
		  const el = document.querySelector('.certlookup-stats li:nth-child(2) .certlookup-stats-item-content a:nth-child(2) > div');
		  return el ? el.textContent.trim() : null;
		});
	
		const data = await parse(page);
			res.json({ data: data, inGrade: inGrade });
		await browser.close();
		}
	
		async function parse(page) {
		return await page.evaluate(()=>{
			return Array.from(document.querySelectorAll("ul.certlookup-stats li:nth-child(2)")).map(el => {
			  return {
				inGrade: document.querySelector(".certlookup-stats li:nth-child(2) .certlookup-stats-item-content a:nth-child(2) > div")?.innerText,
				higherGrade: document.querySelector(".certlookup-stats li:nth-child(2) .certlookup-stats-item-content a:nth-child(3) > div")?.innerText,
				obv: document.querySelector("body div.certlookup-details-wrapper .certlookup-images-item:nth-child(3) a")?.getAttribute('href'),
				rev: document.querySelector("body div.certlookup-details-wrapper .certlookup-images-item:nth-child(4) a")?.getAttribute('href'),
			  };
			});
		  });
		}
	
		async function close_popup(page) {
		  try {
			const close_btn = await page.waitForSelector('body > div.email-signup.modal.ng-isolate-scope.modal-show > div.modal-dialog > div.modal-dialog-close.icon', { timeout: 35000, visible: true });
			console.log("Popup appeared! Closing...");
			await close_btn.click();
			console.log("Popup closed!");
		  } catch (e) {
			console.log("Popup didn't appear.");
		  }
		}
	
	}
	else{
		res.send('Cert number is missing.'); 
	}
}) 

app.get('/generate-pdf', async (req, res) => {
  console.log('generate-pdf get')
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', true);
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  let url = req.query.url;
  if(url){

	  const browser = await puppeteer.launch({
	    browser: 'chrome',
	    protocol: 'webDriverBiDi', // CDP would be used by default for Chrome.
	  });
	  const page = await browser.newPage();
		
	  // Load your HTML and wait for assets
	  await page.goto(url, { waitUntil: 'networkidle0' });
	
	  await page.waitForSelector('.ML__math', {timeout: 1000}).catch(() => {
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
  }
  else{
	res.send('Url is missing.'); 
  }
});

app.post('/generate-pdf', async (req, res) => {
  console.log('generate-pdf post')
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', true);
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  const url = req.body;

  const browser = await puppeteer.launch({
    browser: 'chrome',
    protocol: 'webDriverBiDi', // CDP would be used by default for Chrome.
  });
  const page = await browser.newPage();
	
  // Load your HTML and wait for assets
  await page.goto(url, { waitUntil: 'networkidle0' });

  await page.waitForSelector('.ML__math', {timeout: 1000}).catch(() => {
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

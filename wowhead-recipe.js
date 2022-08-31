const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const papa = require('papaparse');
const sanitize = require("sanitize-filename");


const recipe = [
    { code: "en-US", name: "United States - English" },
    { code: "zh-HK", name: "香港/澳門特別行政區 - 繁體中文" },
    { code: "zh-TW", name: "台灣 - 繁體中文" },
];


var locale = async (page) => {

    var localePage = 'https://www.xbox.com/en-US/Shell/ChangeLocale';
    await page.goto(localePage, { 'timeout': 60 * 1000 });
    await page.waitForSelector('#PageContent > div.container > div.form-row > div > div.row > a', { timeout: 30 * 1000 });
    var content = await page.$$eval('#PageContent > div.container > div.form-row > div > div.row > a', els => {
        var codematch = /(?<=\/)[a-zA-Z]{2}-[a-zA-Z]{2}(?=\/)/;
        return els.map(el => {
            return {
                code: el.href.match(codematch)[0],
                name: el.textContent
            }
        })
    });
    return content.filter(el => black.includes(el.code) == false);
}


var spider = async (regions, page) => {
    var results = [];
    const domain = 'https://www.xbox.com'
    for (let i = 0; i < regions.length; i++) {
        let url = `${domain}/${regions[i].code}/live/gold#gameswithgold`;
        console.log(`${i + 1}\/${regions.length} ${regions[i].code}: ${regions[i].name}`)
        try {
            await page.goto(url, { timeout: 60 * 1000 });
            await page.waitForSelector('#ContentBlockList_9 section a', { timeout: 30 * 1000 });
            var contents = await page.$$eval('#ContentBlockList_9 section a', els => {
                return els.map(el => {
                    var href = el.getAttribute('href');
                    var img = el.querySelector('img').getAttribute('src');
                    var availDate = el.querySelector('span.availDate').innerText;
                    var title = el.querySelector('h3.c-heading').innerText;
                    return { title, availDate, img, href };
                })
            });
            contents.forEach(e => {
                e.rName = regions[i].name;
                e.rCode = regions[i].code;
                e.source = url;
                e.storeLink = domain + '/' + e.rCode + e.href.slice(domain.length);
            });
        } catch { e => console.log(e) }
        results = results.concat(contents);
    }
    return results
}

async function downloadImage(imageFilename, imageURL) {
    if (fs.existsSync(imageFilename)) { return };
    const url = imageURL;
    const fpath = path.resolve(__dirname, imageFilename)
    const writer = fs.createWriteStream(fpath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}

function readCSV(f) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(f)) {
            var a = [];
            resolve(a);
        }
        var content = fs.readFileSync(f, 'utf8');
        papa.parse(content, {
            header: true,
            skipEmptyLines: true,
            delimiter: ',\t',
            complete: (results) => {
                resolve(results.data)
            },
        });
    });
}

function shrinkBy(arr, key) {
    var o = {};
    arr.forEach(e => {
        if (!o[e[key]]) {
            o[e[key]] = e;
        } else {
            o[e[key]].rCode = o[e[key]].rCode + ',' + e.rCode;
        }
        var codes = o[e[key]].rCode.split(',');
        codes = codes.filter((v, i, a) => a.indexOf(v) === i);
        o[e[key]].rCode = codes.join(',');
    });
    return Object.values(o);
}

var papaOutputFormat = {
    header: true,
    newline: '\r\n',
    delimiter: ',\t',
    columns: ['title', 'availDate', 'storeLink', 'rCode'] //, 'rName', 'source'
}

async function main() {
    console.log('Job started.')
    var browserConfig = { headless: true };
    if (process.platform == 'win32') { browserConfig.proxy = { server: '127.0.0.1:1080' }; }
    if (process.platform == 'darwin') { browserConfig.proxy = { server: '127.0.0.1:7890' }; }
    const browser = await chromium.launch(browserConfig);
    const page = await browser.newPage()
    const disabledTypes = ['image', 'font', 'stylesheet'];
    await page.setViewportSize({ width: 1200, height: 1000 });
    page.route('**/*', (route) => {
        if (disabledTypes.includes(route.request().resourceType())) { route.abort() } else { route.continue() };
    });

    // add unique new locales to defined regions
    var localesnow = await locale(page);
    var adds = localesnow.filter(el => regions.find(r => r.code == el.code) == undefined);
    var locales = regions.concat(adds);
    console.log('Locales loaded:' + locales.length);

    // spider games
    var data = await spider(locales, page);

    // close browser
    await page.close();
    await browser.close();


    //udata for console print
    var udata = shrinkBy(data, 'title');
    var ucsv = papa.unparse(udata, papaOutputFormat);
    console.log('==============================');
    console.log(ucsv.replaceAll('\t', '\r\n'));
    console.log('==============================');

    //ualldata for csv file output
    var filename = 'AllRegionXboxGoldGames.csv'
    var old_data = await readCSV(filename);
    var alldata = data.concat(old_data);
    var ualldata = shrinkBy(alldata, 'title');
    var uallcsv = papa.unparse(ualldata, papaOutputFormat);
    if (fs.existsSync(filename)) { fs.unlinkSync(filename) };
    fs.appendFileSync(filename, uallcsv, 'utf-8');

    console.log(`writing data to csv and downloading cover images`);
    for (let i = 0; i < udata.length; i++) {
        var item = ualldata[i];
        var filename = sanitize('A.' + item.rCode.split(',')[0] + '.' + item.title + '.' + item.availDate.match(/\d{1,2}\/\d{1,2}/g)[0].replaceAll('\/', '-') + '.jpg');
        var imgurl = item.img;
        if (imgurl == undefined) { continue } else {
            await downloadImage(filename, imgurl)
        }
    }

    console.log('All jobs done.');
}

main();
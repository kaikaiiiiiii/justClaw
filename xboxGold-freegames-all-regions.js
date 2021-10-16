const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const papa = require('papaparse');
const _ = require('lodash');
const sanitize = require("sanitize-filename");


const regions = [
    { code: "zh-HK", name: "香港/澳門特別行政區 - 繁體中文" },
    { code: "zh-TW", name: "台灣 - 繁體中文" },
    { code: "en-HK", name: "Hong Kong/Macau (SAR) - English" },
    { code: "ja-JP", name: "日本 - 日本語" },
    { code: "ko-KR", name: "대한민국 - 한국어" },
    { code: "en-US", name: "United States - English" },
    { code: "en-AU", name: "Australia - English" },
    { code: "en-CA", name: "Canada - English" },
    { code: "en-GB", name: "United Kingdom - English" },
    { code: "en-IE", name: "Ireland - English" },
    { code: "en-IN", name: "India - English" },
    { code: "en-NZ", name: "New Zealand - English" },
    { code: "en-SG", name: "Singapore - English" },
    { code: "en-ZA", name: "South Africa - English" },
    { code: "fr-BE", name: "Belgique - Français" },
    { code: "fr-CA", name: "Canada - Français" },
    { code: "fr-CH", name: "Suisse - Français" },
    { code: "fr-FR", name: "France - Français" },
    { code: "de-AT", name: "Österreich - Deutsch" },
    { code: "de-CH", name: "Schweiz - Deutsch" },
    { code: "de-DE", name: "Deutschland - Deutsch" },
    { code: "es-AR", name: "Argentina - Español" },
    { code: "es-CL", name: "Chile - Español" },
    { code: "es-CO", name: "Colombia - Español" },
    { code: "es-ES", name: "España - Español" },
    { code: "es-MX", name: "México - Español" },
    { code: "it-IT", name: "Italia - Italiano" },
    { code: "ar-AE", name: "الإمارات العربية المتحدة - العربية" },
    { code: "ar-SA", name: "المملكة العربية السعودية - العربية" },
    { code: "cs-CZ", name: "Česká Republika - Čeština" },
    { code: "da-DK", name: "Danmark - Dansk" },
    { code: "el-GR", name: "Ελλάδα - Ελληνικά" },
    { code: "fi-FI", name: "Suomi - Suomi" },
    { code: "he-IL", name: "ישראל - עברית" },
    { code: "hu-HU", name: "Magyarország - Magyar" },
    { code: "nb-NO", name: "Norge - Norsk bokmål" },
    { code: "nl-BE", name: "België - Nederlands" },
    { code: "nl-NL", name: "Nederland - Nederlands" },
    { code: "pl-PL", name: "Polska - Polski" },
    { code: "pt-BR", name: "Brasil - Português" },
    { code: "pt-PT", name: "Portugal - Português" },
    { code: "ru-RU", name: "Россия - Русский" },
    { code: "sk-SK", name: "Slovensko - Slovenčina" },
    { code: "sv-SE", name: "Sverige - Svenska" },
    { code: "tr-TR", name: "Türkiye - Türkçe" },
    // China mainland xbox gold has no free games, don't uncommet it
    // { code: "zh-CN", name: "中国 - 中文" }, 
];


var spider = async (regions) => {
    var results = [];
    const browser = await chromium.launch({
        //headless: false,
    })
    const page = await browser.newPage()
    await page.setViewportSize({ width: 1200, height: 1000 });
    page.route('**/*', (route) => {
        if (route.request().resourceType() == 'image') { route.abort() } else { route.continue() };
    });
    console.log('Robot started.')
    for (let i = 0; i < regions.length; i++) {
        let url = `https://www.xbox.com/${regions[i].code}/live/gold#gameswithgold`;
        console.log(`${i + 1}\/${regions.length} visiting ${regions[i].code}: ${regions[i].name}`)
        await page.goto(url, { timeout: 0 });
        await page.waitForSelector('#ContentBlockList_9 section a', { timeout: 600 * 1000 });
        var contents = await page.$$eval('#ContentBlockList_9 section a', els => {
            return els.map(el => {
                var storeLink = el.getAttribute('href');
                var img = el.querySelector('img').getAttribute('src');
                var availDate = el.querySelector('span.availDate').innerText;
                var title = el.querySelector('h3.c-heading').innerText;
                return { title, availDate, img, storeLink };
            })
        });
        contents.forEach(e => {
            e.rName = regions[i].name;
            e.rCode = regions[i].code;
            e.source = url;
        });
        results = results.concat(contents);
    }
    await page.close();
    await browser.close();
    return results
}

async function downloadImage(imageFilename, imageURL) {
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

async function main() {
    console.log(`Job started.`)
    var data = await spider(regions);
    var udata = _.uniqBy(data, 'title');
    var ucsv = papa.unparse(udata, {
        header: true,
        newline: '\r\n',
        delimiter: ',\t',
        columns: ['availDate', 'rCode', 'title', 'storeLink'] //, 'rName', 'source'
    });
    var filename = 'AllRegionXboxGoldGames.csv'
    if (fs.existsSync(filename)) { fs.unlinkSync(filename) };
    fs.writeFileSync(filename, ucsv, 'utf-8');

    console.log(`writing data to csv and downloading cover images`)
    for (let i = 0; i < udata.length; i++) {
        var item = udata[i];
        var filename = 'A.' + sanitize(item.title) + '.jpg';
        var imgurl = item.img;
        await downloadImage(filename, imgurl)
    }

    console.log('All jobs done.');
}

main();


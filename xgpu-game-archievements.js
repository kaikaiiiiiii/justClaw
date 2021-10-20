const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const papa = require('papaparse');
const _ = require('lodash');
const sanitize = require("sanitize-filename");
const HTMLParser = require('node-html-parser');

const start = 'https://www.trueachievements.com/xbox-game-pass/games';

var spider = async (url) => {
    var results = [];
    const browser = await chromium.launch({
        headless: false,

        devtools: true,
    })
    const page = await browser.newPage()
    await page.setViewportSize({ width: 1600, height: 1000 });
    page.route('**/*', (route) => {
        var blockType = ['image', 'font','stylesheet']
        if (
            blockType.includes(route.request().resourceType())
            ) {
        route.abort()
    } else {
            route.continue();
        };
    });
    console.log('Robot started.')

    await page.goto(url, { timeout: 600 * 1000 });
    var gamelist = [];
    do {
        await page.waitForSelector('table#oGameList a');
        await page.waitForSelector('div#oGameListContent ul.pagination li.l');
        await page.waitForSelector('table#oGameList tr td');
        
        var content = await page.$eval('table#oGameList',
            el => {
                var games = el.querySelectorAll('tr.odd, tr.even');
                var data = [];
                for (let i = 0; i < games.length; i++) {
                    var g = games[i];
                    var tds = g.querySelectorAll('td');
                    var title = tds[1].querySelector('a').innerText;
                    var link = tds[1].querySelector('a').href;
                    var score = tds[2].innerText.split(',').join('').split('\n')
                    var pts = parseInt(score[1].substring(1, score[1].length - 1));
                    var gs = parseInt(score[0]);
                    var hot = parseInt(tds[4].innerText.split(',').join(''));
                    var fin = parseFloat(tds[5].innerText)/100;
                    var time = tds[6].innerText
                    
                    var rate = tds[7];
                    var added = tds[9];
                    var item = {
                        title,
                        time,
                        pts,
                        gs,
                        hot,
                        fin,
                        link,
                        
                    };
                    data.push(item);
                };
                return data
            });
        gamelist = gamelist.concat(content);
    } while (false);

    console.log(JSON.stringify(gamelist));
    await page.close();
    await browser.close();
    return results
}


async function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
     })
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
    var filename = 'AllRegionXboxGoldGames.csv'

    var index = await spider(start);
    // var udata = _.uniqBy(data, 'title');
    // var ucsv = papa.unparse(udata, {
    //     header: true,
    //     newline: '\r\n',
    //     delimiter: ',\t',
    //     columns: ['availDate', 'rCode', 'title', 'storeLink'] //, 'rName', 'source'
    // });

    // if (fs.existsSync(filename)) { fs.unlinkSync(filename) };
    // fs.writeFileSync(filename, ucsv, 'utf-8');

    // console.log(`writing data to csv and downloading cover images`)
    // for (let i = 0; i < udata.length; i++) {
    //     var item = udata[i];
    //     var filename = 'A.' + sanitize(item.title) + '.jpg';
    //     var imgurl = item.img;
    //     await downloadImage(filename, imgurl)
    // }

    // console.log('All jobs done.');
}

main();


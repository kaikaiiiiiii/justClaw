const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');


var totalPages;
var startPage = 12005;

(async () => {
    //config zone
    var browserConfig = {
        headless: true,
        //devtools: true
    };
    var pageid = startPage;

    //start browser
    const browser = await chromium.launchPersistentContext('Profiles', browserConfig);
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 1000 });
    console.log('Robot started.');

    //clawing zone

    var url = `https://www.nexusmods.com/Core/Libs/Common/Widgets/ModList?RH_ModList=nav:true,home:false,type:0,user_id:0,game_id:0,advfilt:false,include_adult:true,page_size:20,page:${pageid}`
    do {
        await console.log(`Page ${pageid}`);
        await page.goto(url, { timeout: 0 });
        await page.waitForSelector('#mod-list > ul > li:nth-child(19) > div.mod-tile-left', { timeout: 600 * 1000 });
        totalPages = await page.$$eval('#mod-list > div.pagenav.head-nav > div > ul > li', els => {
            return els[els.length - 2].querySelector('a').innerText;
        });
        var contents = await page.$$eval('#mod-list > ul.tiles > li > div.mod-tile-left > div.tile-desc > div.tile-content', els => {
            return els.map(el => {
                var title = el.querySelector('p > a').innerText;
                var href = el.querySelector('p > a').getAttribute('href');
                var cate = el.querySelectorAll('.meta > .category > a')[0].innerText;
                var subcate = el.querySelectorAll('.meta > .category > a')[1].innerText;
                var description = el.querySelector('p.desc').innerText;
                return { title, href, description, cate, subcate }
            })
        });
        await writeCSV(contents);
        pageid++;
        url = `https://www.nexusmods.com/Core/Libs/Common/Widgets/ModList?RH_ModList=nav:true,home:false,type:0,user_id:0,game_id:0,advfilt:false,include_adult:true,page_size:20,page:${pageid}`
        //await rdelay();
    } while (pageid < totalPages + 1);
    await page.close();
    await browser.close();
})();

// async function rdelay() {
//     return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 200 + 200)));
// }

function writeCSV(objectArray) {
    var csv = objectArray.map(function (e) {
        return Object.keys(e).map(function (k) {
            return '"' + e[k] + '"';
        }).join(",");
    }).join("\n");
    csv = csv + "\n";
    var f = path.resolve(__dirname, './test.csv');
    fs.appendFileSync(f, csv);
}


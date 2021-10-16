const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const papa = require('papaparse');


/////////////////////////////////////////
// 页面抓取，依赖 playwright
// npm i -g playwright
/////////////////////////////////////////

const userDataDir = 'Profile';
const regions = [
    { code: "zh-HK", name: "香港/澳門特別行政區 - 繁體中文" },
    { code: "en-US", name: "United States - English" },
    // { code: "es-AR", name: "Argentina - Español" },
    // { code: "pt-BR", name: "Brasil - Português" },
    // { code: "en-CA", name: "Canada - English" },
    // { code: "fr-CA", name: "Canada - Français" },
    // { code: "es-CL", name: "Chile - Español" },
    // { code: "es-CO", name: "Colombia - Español" },
    // { code: "es-MX", name: "México - Español" },
    // { code: "nl-BE", name: "België - Nederlands" },
    // { code: "fr-BE", name: "Belgique - Français" },
    // { code: "cs-CZ", name: "Česká Republika - Čeština" },
    // { code: "da-DK", name: "Danmark - Dansk" },
    // { code: "de-DE", name: "Deutschland - Deutsch" },
    // { code: "es-ES", name: "España - Español" },
    // { code: "fr-FR", name: "France - Français" },
    // { code: "en-IE", name: "Ireland - English" },
    // { code: "it-IT", name: "Italia - Italiano" },
    // { code: "hu-HU", name: "Magyarország - Magyar" },
    // { code: "nl-NL", name: "Nederland - Nederlands" },
    // { code: "nb-NO", name: "Norge - Norsk bokmål" },
    // { code: "de-AT", name: "Österreich - Deutsch" },
    // { code: "pl-PL", name: "Polska - Polski" },
    // { code: "pt-PT", name: "Portugal - Português" },
    // { code: "de-CH", name: "Schweiz - Deutsch" },
    // { code: "sk-SK", name: "Slovensko - Slovenčina" },
    // { code: "fr-CH", name: "Suisse - Français" },
    // { code: "fi-FI", name: "Suomi - Suomi" },
    // { code: "sv-SE", name: "Sverige - Svenska" },
    // { code: "en-GB", name: "United Kingdom - English" },
    // { code: "el-GR", name: "Ελλάδα - Ελληνικά" },
    // { code: "ru-RU", name: "Россия - Русский" },
    // { code: "en-AU", name: "Australia - English" },
    // { code: "en-HK", name: "Hong Kong/Macau (SAR) - English" },
    // { code: "en-IN", name: "India - English" },
    // { code: "en-NZ", name: "New Zealand - English" },
    // { code: "en-SG", name: "Singapore - English" },
    // { code: "ko-KR", name: "대한민국 - 한국어" },
    // { code: "ja-JP", name: "日本 - 日本語" },
    // { code: "zh-TW", name: "台灣 - 繁體中文" },
    // { code: "zh-CN", name: "中国 - 中文" },
    // { code: "en-ZA", name: "South Africa - English" },
    // { code: "tr-TR", name: "Türkiye - Türkçe" },
    // { code: "he-IL", name: "ישראל - עברית" },
    // { code: "ar-AE", name: "الإمارات العربية المتحدة - العربية" },
    // { code: "ar-SA", name: "المملكة العربية السعودية - العربية" }
];

//var selectorresults = '#ContentBlockList_9';
//var urlFormat = `https://www.xbox.com/${code}/live/gold#gameswithgold`;

var spider = async (regions) => {
  var results = [];
  const browser = await chromium.launchPersistentContext(userDataDir,{
    headless: false,
    //proxy: {server: 'localhost:1080'},
    timeout: 0,
    userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
  })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1200, height: 1000 });
  page.route('**/*', (route) => {
    if (route.request().resourceType() == 'image') { route.abort()} else { route.continue()};
  });
  for (let i = 0; i < regions.length; i++) {
    let url = `https://www.xbox.com/${regions[i].code}/live/gold#gameswithgold`;
    let region = regions[i].name;
    await page.goto(url, {timeout:0});
    await page.waitForSelector('#ContentBlockList_9 section a');
    var contents = await page.$$eval('#ContentBlockList_9 section a', els => {
      return els.map(el => {
        var link = el.getAttribute('href');
        var img = el.querySelector('img').getAttribute('src');
        var date = el.querySelector('span.availDate').innerText;
        var title = el.querySelector('h3.c-heading').innerText;
        return { title, date, img, link};
      })
    });
    contents.forEach(e => { e.r = region });
    results = results.concat(contents);
  }
  await page.close();
  await browser.close();
  return results
}

async function main(){
  var data = await spider(regions);
  console.log(data);
}

main();

/*
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function downloadImage(url, name) {
  var writer = fs.createWriteStream(name);
  const response = await axios({
    url:url,
    method: 'GET',
    responseType:'stream'
  })
  response.data.pipe(writer);
  return new Promise((resolve, rejects) => {
    writer.on('finish', resolve);
    writer.on('error', rejects);
  });
}



// Main 函数，函数定义后立刻执行

(async () => {
  var spider_old = await readCSV('spider_old.csv');
  var spider_new = await spider(sheets);
  //计算 diff，使用对象 key 的 hash map 属性避免两层 for 循环。
  var diff = {};
  spider_old.forEach(element => {
    diff[element.name] = element;
    diff[element.name].status = '-';
  });
  spider_new.forEach(element => {
    if (diff[element.name]) {
      diff[element.name].status = '~'
    } else {
      diff[element.name] = element;
      diff[element.name].status = '+';
    }
  });
  var diffdata = Object.values(diff);
  //转成 html。
  var tablehtml = diffdata.map(e => {
    var row = '<tr>name</tr><tr>title</tr><tr>status</tr>';
    if (e.status == '-') {
      row += `<tr style='color:red'>`
    } else if (e.status == '+') {
      row += `<tr style='color:green'>`
    } else {
      row += `<tr>`
    }
    row += `<td>${e.name}</td>`;
    row += `<td>${e.title}</td>`;
    row += `<td>${e.status}</td>`;
    row += `</tr>`;
    return row;
  }).join('');

  tablehtml = `<table><tr>name</tr><tr>title</tr><tr>status</tr>` + tablehtml + `</table>`;

  var dataObject = new FormData();
  dataObject.append('pass', 'gslbexwytehkcadh');
  dataObject.append('user', '151493994@qq.com');
  dataObject.append('to', '151493994@qq.com');
  dataObject.append('title', '推送测试');
  dataObject.append('content', tablehtml);
  dataObject.append('name', 'spider');
  dataObject.append('toname', 'kaikai');
  
  var config = {
    method: 'post',
    url: 'https://api.qzone.work/api/send.mail',
    headers: { 
      ...dataObject.getHeaders()
    },
    data: dataObject
  };
  
  axios(config)
  .then(function (response) {
    console.log(JSON.resultsify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  });

  if (fs.existsSync('spider_old.csv')) { fs.unlinkSync('spider_old.csv') }
  fs.writeFileSync('spider_old.csv', papa.unparse(spider_new, { "header": true, "skipEmptyLines": true }));

})();


*/


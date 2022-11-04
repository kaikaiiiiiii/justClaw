const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const papa = require('papaparse');
const sanitize = require("sanitize-filename");


const recipes = [
    "https://www.wowhead.com/wotlk/cn/enchanting",
    "https://www.wowhead.com/wotlk/cn/jewelcrafting",
    "https://www.wowhead.com/wotlk/cn/engineering",
    "https://www.wowhead.com/wotlk/cn/tailoring",
    "https://www.wowhead.com/wotlk/cn/blacksmithing",
    "https://www.wowhead.com/wotlk/cn/alchemy",
    "https://www.wowhead.com/wotlk/cn/leatherworking",
    "https://www.wowhead.com/wotlk/cn/cooking",
    "https://www.wowhead.com/wotlk/cn/inscription",
    "https://www.wowhead.com/wotlk/cn/mining",
    "https://www.wowhead.com/wotlk/cn/first-aid"
];


var getRecipeList = async (page) => {
    var content = await [];
    return content;
}

var getSpell = async (itemid) => {
    var content = [{
        category: 'enchanting',
        name: '附魔护腕 - 特效耐力',
        type: 'spell',
        link: 'https://www.wowhead.com/wotlk/cn/spell=62256/%E9%99%84%E9%AD%94%E6%8A%A4%E8%85%95-%E7%89%B9%E6%95%88%E8%80%90%E5%8A%9B',
        recipe: [{ name: "强效宇宙精化", id: "34055", qty: 4 }, { name: "深渊水晶", id: "34057", qty: 1 },],
        skill: [450, 460, 470, 480]
    }]
    return content;
}

var getItem = async (itemid) => {
    var content = {
        name: "强效宇宙精华",
        id: "34055"
    }
    return content;
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
    // page.route('**/*', (route) => {
    //     if (disabledTypes.includes(route.request().resourceType())) { route.abort() } else { route.continue() };
    // });

    var itemlist = [];
    var spelllist = [];
    for (let i = 0; i < recipes.length; i++) {

    }

    console.log('All jobs done.');
}

main();
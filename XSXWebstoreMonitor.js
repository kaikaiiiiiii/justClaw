const { chromium } = require('playwright');
const nodemailer = require("nodemailer");
const axios = require('axios');
const config = require('./config.js');


async function sendMail(title, text) {
    var user = config.mail.user; //自己的邮箱
    var pass = config.mail.pass; //qq邮箱客户端专用密码
    let transporter = nodemailer.createTransport({
        host: "smtp.qq.com",
        port: 587,
        secure: false,
        auth: {
            user: user,
            pass: pass
        }
    });
    let info = await transporter.sendMail({
        from: `${user}`,
        to: config.mail.to,
        subject: title,
        html: text
    });
    console.log("发送成功", info);
}

async function sendWechat(title, message) {
    var etitle = encodeURIComponent(title);
    var emessage = encodeURIComponent(message);
    var url = `http://wx.xtuis.cn/${config.wechat.token}.send?text=${etitle}&desp=${emessage}`;
    var response = await axios.get(url);
    console.log('sendWechat', response)
}

function delay(params) {
    var ms = params || Math.random() * 2000 + 5000;
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}

(async () => {
    var mailcount = 0;
    var wechatcount = 0;
    const browser = await chromium.launch({
        // const browser = await chromium.launchPersistentContext("Profiles", {
        headless: true,
        devtools: false,
        //proxy: {server: 'localhost:1080'},
        timeout: 0,
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1600, height: 1000 });
    const disabledTypes = ['image', 'font'];
    page.route('**/*', (route) => {
        if (disabledTypes.includes(route.request().resourceType())) { route.abort() } else { route.continue() };
    });
    do {
        await page.goto('https://www.microsoftstore.com.cn/xbox-series-x-configurate', { timeout: 0 });
        await page.waitForSelector('#bundleHeaderSummary .box-tocart .fieldset .actions', { timeout: 0 });
        var status = await page.$eval('#bundleHeaderSummary .box-tocart .fieldset .actions button', el => el.className);
        status = status.split(' ');
        if (status.includes('hide')) {
            mailcount = 0;
            wechatcount = 0;
        } else {
            var title = `微软商城 XBOX 有货`
            var date = new Date();
            var text = `现在时间：${date}<br/ ><a href='https://www.microsoftstore.com.cn/xbox-series-x-configurate'>https://www.microsoftstore.com.cn/xbox-series-x-configurate</a>`
            if (mailcount % 10 == 0 && mailcount < 100) {
                await sendMail(title, text)
            }
            if (wechatcount % 3 == 0 && wechatcount < 10) {
                await sendWechat(title, text);
            }
            mailcount++;
            wechatcount++;
        }
        await delay()
    } while (true);
    await page.close();
    await browser.close();
})();
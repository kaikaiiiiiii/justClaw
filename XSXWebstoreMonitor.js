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
/* 核心是参数 is_saleable */
(async () => {
    var mailcount = 0;
    var wechatcount = 0;
    var status = [];
    const browser = await chromium.launch({
        // const browser = await chromium.launchPersistentContext("Profiles", {
        headless: false,
        //proxy: {server: 'localhost:1080'},
        timeout: 0,
    });
    const page = await browser.newPage();
    const disabledTypes = ['image', 'font'];
    const disabledDomain = ['ipinyou.com', 'adobedtm.com', 'omtrdc.net', 'baidu.com'];
    var a = 'product-addtocart-button1';
    const list = [
        'https://cdn.microsoftstore.com.cn/static/version1643603744/frontend/Microsoft/rwd/zh_Hans_CN/js/oneplayer.min.js',
        'https://az416426.vo.msecnd.net/scripts/c/ms.analytics-web-2.min.js',
        'https://az725175.vo.msecnd.net/scripts/jsll-4.js',
        'https://wcpstatic.microsoft.com/mscc/lib/v2/wcp-consent.js',
        'https://assets.adobedtm.com/launch-EN2c23346949374f60871c2d64aa18ff3c.min.js',
        'https://hm.baidu.com/h.js?65c86afa131524ede2e7071a40181124',
        'https://cdn.microsoftstore.com.cn/static/frontend/Microsoft/rwd/zh_Hans_CN/Magento_Theme/js/at.min.js',
        'https://cdn.microsoftstore.com.cn/static/frontend/Microsoft/rwd/zh_Hans_CN/Magento_Theme/js/at-config.min.js'];
    page.route('**/*', (route) => {
        var flag = true;
        var url = route.request().url();
        var type = route.request().resourceType();
        if (disabledDomain.some(item => url.includes(item))) { flag = false; };
        //if (disabledTypes.includes(type)) { flag = false };
        if (list.includes(url)) { flag = false };
        // if (type == 'script') { console.log(url) };
        if (flag) { route.continue() } else {
            route.abort()
        }
    });
    do {
        await page.goto('https://www.microsoftstore.com.cn/xbox-series-x-configurate', { timeout: 0 });
        await page.waitForSelector('#bundleHeaderSummary .box-tocart .fieldset .actions', { timeout: 0 });
        status = await page.$eval('#bundleHeaderSummary .box-tocart .fieldset .actions button', el => el.className.split(' '));
        if (status.includes('hide')) {
            mailcount = 0;
            wechatcount = 0;
        } else {
            var title = `微软商城 XBOX 有货`
            var date = new Date();
            var text = `现在时间：${date}<br/ ><a href='https://www.microsoftstore.com.cn/xbox-series-x-configurate'>https://www.microsoftstore.com.cn/xbox-series-x-configurate</a>`
            if (mailcount % 10 == 0 && mailcount < 100) {
                //await sendMail(title, text)
            }
            if (wechatcount % 3 == 0 && wechatcount < 10) {
                //await sendWechat(title, text);
            }
            mailcount++;
            wechatcount++;
        }
        await delay()
    } while (false);
    //await page.close();
    //await browser.close();
})();
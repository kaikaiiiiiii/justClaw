const nodemailer = require("nodemailer");
const axios = require('axios');
const { memoryUsage } = require('process');
const config = require('./config.js');

const header = {
    'User-Agent': 'Mozilla/ 5.0(Macintosh; Intel Mac OS X 10_15_7) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 98.0.4758.109 Safari / 537.36'
}

var mailcount = 0;
var wechatcount = 0;

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
    console.log("sendMail", info.response);
}

async function sendWechat(title, message) {
    var etitle = encodeURIComponent(title);
    var emessage = encodeURIComponent(message);
    var tokens = config.wechat.token;
    for (let t = 0; t < tokens.length; t++) {
        var thistoken = tokens[t];
        var url = `http://wx.xtuis.cn/${thistoken}.send?text=${etitle}&desp=${emessage}`;
        var response = await axios.get(url);
        console.log(response);
    }
    console.log('sendWechat', response.status)
}

function delay(params) {
    var ms = params || Math.random() * 3000 + 3000;
    console.log('Delay:\t', ms);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}


/* 核心是参数 is_saleable */
(async () => {
    var salepatten = /\"is_saleable\"\:\s*true/;
    var miniapppatten = /\"only_miniapp\"\:\s*true/;
    do {
        try {
            const { data } = await axios.get('https://www.microsoftstore.com.cn/xbox-series-x-configurate/', {
                headers: header,
                timeout: 2500
            });
            var salematch = salepatten.test(data);
            var miniappmatch = !miniapppatten.test(data);
            console.log(salematch, miniappmatch);
            if (salematch && miniappmatch) {
                if (mailcount < 3 || mailcount % 100 == 0) {
                    sendMail('XSX 在售', 'https://www.microsoftstore.com.cn/xbox-series-x-configurate/');
                }
                if (wechatcount < 3 || wechatcount % 13 == 3) {
                    sendWechat('XSX 在售', 'https://www.microsoftstore.com.cn/xbox-series-x-configurate/');
                }
                mailcount++;
                wechatcount++;
            }
        } catch (error) {
            console.log('ERR:\t', Object.entries(error));
        }
        console.log('MEM:\t', memoryUsage.rss());
        console.log('NOW:\t', new Date());
        await delay()
    } while (true); //change to true befor release
})();

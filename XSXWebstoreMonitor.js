const nodemailer = require("nodemailer");
const axios = require('axios');
const { memoryUsage } = require('process');
const config = require('./config.js');

const header = {
    'User-Agent': 'Mozilla/ 5.0(Macintosh; Intel Mac OS X 10_15_7) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 98.0.4758.109 Safari / 537.36'
}


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
    var url = `http://wx.xtuis.cn/${config.wechat.token}.send?text=${etitle}&desp=${emessage}`;
    var response = await axios.get(url);
    console.log('sendWechat', response.status)
}

function delay(params) {
    var ms = params || Math.random() * 2000 + 5000;
    console.log('delay', ms);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}


/* 核心是参数 is_saleable */
(async () => {
    var content = '';
    var patten = /\"is_saleable\"\:\s*true/;
    var matchflag = false;
    do {
        try {
            const { data } = await axios.get('https://www.microsoftstore.com.cn/xbox-series-x-configurate/', {
                headers: header
            });
            content = data;
        } catch (e) {
            console.log(Object.keys(e), e.message);
        }
        matchflag = patten.test(content)
        if (matchflag) {
            sendMail('XSX 在售', 'https://www.microsoftstore.com.cn/xbox-series-x-configurate/');
            sendWechat('XSX 在售', 'https://www.microsoftstore.com.cn/xbox-series-x-configurate/');
        }
        console.log(matchflag);
        console.log(memoryUsage.rss());
        await delay()
    } while (false);
})();

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
<<<<<<< HEAD:xsxmon.js
    var ms = params || Math.random() * 3000 + 3000;
=======
    var ms = params || Math.random() * 2000 + 5000;
>>>>>>> ed43b9b5e9be229a18eea7c1abf2ed112adcf868:XSXWebstoreMonitor.js
    console.log('Delay:\t', ms);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}


/* 核心是参数 is_saleable */
(async () => {
    var patten = /\"is_saleable\"\:\s*true/;
    do {
        try {
            const { data } = await axios.get('https://www.microsoftstore.com.cn/xbox-series-x-configurate/', {
                headers: header,
		    timeout: 2500
            });
            var match = patten.test(data);
            console.log('Check:\t', match);
            if (match) {
                sendMail('XSX 在售', 'https://www.microsoftstore.com.cn/xbox-series-x-configurate/');
                sendWechat('XSX 在售', 'https://www.microsoftstore.com.cn/xbox-series-x-configurate/');
            }
        } catch (error) {
<<<<<<< HEAD:xsxmon.js
            console.log('ERR:\t',Object.entries(error));
=======
            console.log(Object.entries(error));
>>>>>>> ed43b9b5e9be229a18eea7c1abf2ed112adcf868:XSXWebstoreMonitor.js
        }
        console.log('MEM:\t', memoryUsage.rss());
        console.log('NOW:\t', new Date());
        await delay()
<<<<<<< HEAD:xsxmon.js
    } while (true); //change to true befor release
=======
    } while (false); //change to true befor release
>>>>>>> ed43b9b5e9be229a18eea7c1abf2ed112adcf868:XSXWebstoreMonitor.js
})();

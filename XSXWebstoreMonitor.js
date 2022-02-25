const nodemailer = require("nodemailer");
const axios = require('axios');
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
    var stock = false;
    var patten = /\"is_saleable\"\:\s*false/;
    try {
        const { data } = await axios.get('https://www.microsoftstore.com.cn/xbox-series-x-configurate/', {
            headers: header
        });
        console.log(data);
    } catch (e) {
        console.log(Object.keys(e), e.message);
    }
    // // console.log(content.statusText);
    // // console.log(content.headers);
    // console.log(content.config);
    // // console.log(content.request);
    /*
        do {
    
            if (true) {
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
    */
})();

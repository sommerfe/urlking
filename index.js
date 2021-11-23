const express = require("express");
const useragent = require('express-useragent');
const path = require("path");
const app = express();
const port = process.env.PORT || "8080";
app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});


app.get("/", (req, res) => {
    var source = req.headers['user-agent']
    var ua = useragent.parse(source);
    var { appleUrl, androidUrl, windowsUrl, elseUrl } = req.query
    console.log(appleUrl, androidUrl, windowsUrl, elseUrl)
    console.log(ua)
    let redirectUrl = ''
    if (ua.isWindows) {
        // redirectUrl = 'https://microsoft.com'
        redirectUrl = windowsUrl ?? elseUrl ?? 'https://microsoft.com'
    } else if (isApple(ua)) {
        // redirectUrl = 'https://apple.com'
        redirectUrl = appleUrl ?? elseUrl ?? 'https://apple.com'
    } else if (isAndroid(ua)) {
        // redirectUrl = 'https://google.com'
        redirectUrl = androidUrl ?? elseUrl ?? 'https://google.com'
    } else {
        redirectUrl = elseUrl ?? windowsUrl ?? androidUrl ?? appleUrl ?? 'https://microsoft.com'
    }
    //res.status(200).send(`WHATABYTE: Food For Devs ${ua}`, );
    res.redirect(301, redirectUrl)
});


function isApple(ua) {
    return ua.isiPad || ua.isiPod || ua.isiPhone || ua.isiPhoneNative
}

function isAndroid(ua) {
    return ua.isAndroid || ua.isAndroidNative || ua.isChromeOS
}
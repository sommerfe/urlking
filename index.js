const express = require("express");
const useragent = require('express-useragent');
const bodyParser = require("body-parser");
const app = express();
const ObjectId = require('mongodb').ObjectId;
const { MongoClient } = require('mongodb');
require('dotenv').config()
const client = new MongoClient(process.env.DB_URL);

const port = process.env.PORT || "8080";
app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get("/", (req, res) => {
    const redirectUrl = redirect(req)
    res.redirect(301, redirectUrl)
});

app.post("/link", async (req, res) => {
    const linkId = await insertLink(req.body)
    const returnUrl = process.env.RETURN_URL + linkId
    res.send({returnUrl})
});

app.get("/:linkId", async (req, res) => {
    const linkData = await findLink(req.params.linkId)
    const redirectUrl = redirectDB(req, linkData)
    res.redirect(301, redirectUrl)
});

app.get("/test", async (req, res) => {
    res.code(200).send('Tests')
});

function isApple(ua) {
    return ua.isiPad || ua.isiPod || ua.isiPhone || ua.isiPhoneNative
}

function isAndroid(ua) {
    return ua.isAndroid || ua.isAndroidNative || ua.isChromeOS
}


async function insertLink(insertDoc) {
    await client.connect();
    const db = client.db(process.env.DB_NAME)
    const collection = db.collection(process.env.DB_COLLECTION)
    const insertResult = await collection.insertOne(insertDoc)
    return insertResult.insertedId.toString()
}

async function findLink(linkId) {
    await client.connect();
    const db = client.db(process.env.DB_NAME)
    const collection = db.collection(process.env.DB_COLLECTION)
    const result = await collection.findOne({ "_id": ObjectId(linkId) })
    return result
}

function redirect(req) {
    var source = req.headers['user-agent']
    var ua = useragent.parse(source);
    var { appleUrl, androidUrl, windowsUrl, elseUrl } = req.query
    let redirectUrl = ''
    if (ua.isWindows) {
        redirectUrl = windowsUrl ?? elseUrl ?? 'https://microsoft.com'
    } else if (isApple(ua)) {
        redirectUrl = appleUrl ?? elseUrl ?? 'https://apple.com'
    } else if (isAndroid(ua)) {
        redirectUrl = androidUrl ?? elseUrl ?? 'https://google.com'
    } else {
        redirectUrl = elseUrl ?? windowsUrl ?? androidUrl ?? appleUrl ?? 'https://microsoft.com'
    }
    return redirectUrl
}

function redirectDB(req, linkData) {
    var source = req.headers['user-agent']
    var ua = useragent.parse(source);
    var { appleUrl, androidUrl, windowsUrl, elseUrl } = linkData
    let redirectUrl = ''
    if (ua.isWindows) {
        redirectUrl = windowsUrl ?? elseUrl ?? 'https://microsoft.com'
    } else if (isApple(ua)) {
        redirectUrl = appleUrl ?? elseUrl ?? 'https://apple.com'
    } else if (isAndroid(ua)) {
        redirectUrl = androidUrl ?? elseUrl ?? 'https://google.com'
    } else {
        redirectUrl = elseUrl ?? windowsUrl ?? androidUrl ?? appleUrl ?? 'https://microsoft.com'
    }
    return redirectUrl
}
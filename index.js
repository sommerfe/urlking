const express = require("express")
const useragent = require('express-useragent')
const bodyParser = require("body-parser")
const app = express()
const ObjectId = require('mongodb').ObjectId
const { MongoClient } = require('mongodb')
const cors = require('cors')
const mysql = require('mysql');
const util = require('util')
require('dotenv').config()
const client = new MongoClient(process.env.DB_URL)

var connection = mysql.createConnection({
    host     : process.env.MSQL_HOST,
    port     : process.env.MSQL_PORT,
    user     : process.env.MSQL_USER,
    password : process.env.MSQL_PW,
    database : process.env.MSQL_DB
})
const query = util.promisify(connection.query)

const port = process.env.PORT || "8080";
app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`)
});
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get("/", (req, res) => {
    res.send('Tests')
});

app.post("/link", async (req, res) => {
    const linkId = await insertLink(req.body)
    const returnUrl = process.env.RETURN_URL + linkId
    res.send({returnUrl})
});

app.get("/:linkId", async (req, res) => {
    try {
        const linkData = await findLink(req.params.linkId)
        const redirectUrl = redirectDB(req, linkData)
        res.redirect(301, redirectUrl)
    } catch (error) {
        res.send('Error')
    }
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
    const linkObject = {
        ...insertDoc,
        visited: 0,
        createdAt: new Date()
    }
    const insertResult = await collection.insertOne(linkObject)
    return insertResult.insertedId.toString()
}

async function findLink(linkId) {
    await client.connect();
    const db = client.db(process.env.DB_NAME)
    const collection = db.collection(process.env.DB_COLLECTION)
    const result = await collection.findOne({ "_id": ObjectId(linkId) })
    if(result) {
        await collection.updateOne(
            { "_id": ObjectId(linkId) },
            { $inc: { visited: 1 }, $set: { lastVisited: new Date() } }
        )
    }
    return result
}

async function findLinkMysql(linkId) {
    const sql = `SELECT * FROM links WHERE id = ${linkId}`
    const result = await query(sql)
    if (result) {
        const sql = `UPDATE links SET visited = visited + 1, lastVisited = ${connection.escape(new Date())} WHERE id = ${linkId}`
        await query(sql)
    }
    return result
}

async function insertLinkMysql(insertDoc) {
    const sql = `INSERT INTO links (url, appleUrl, androidUrl, otherUrl) VALUES ('${insertDoc.url}', '${insertDoc.appleUrl}', '${insertDoc.androidUrl}', '${insertDoc.otherUrl}')`
    const result = await query(sql)
    return result
}

function redirectDB(req, linkData) {
    var source = req.headers['user-agent']
    var ua = useragent.parse(source);
    var { appleUrl, androidUrl, otherUrl } = linkData
    let redirectUrl = ''
    if (isApple(ua)) {
        redirectUrl = appleUrl ?? otherUrl ?? androidUrl ?? 'https://apple.com'
    } else if (isAndroid(ua)) {
        redirectUrl = androidUrl ?? otherUrl ?? appleUrl ?? 'https://google.com'
    } else {
        redirectUrl = otherUrl ?? androidUrl ??  appleUrl ??'https://microsoft.com'
    }
    return redirectUrl
}
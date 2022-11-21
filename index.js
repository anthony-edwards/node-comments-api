'use strict'

const { ApolloServer } = require('apollo-server')
const { RedisCache } = require('apollo-server-cache-redis')
const responseCachePlugin = require('apollo-server-plugin-response-cache')
const MongoClient = require('mongodb').MongoClient

const typeDefs = require('./schemas/schema')
const resolvers = require('./resolvers/resolvers')
const MongoDBDataSource = require('./datasource/datasource')

const promiseRetry = require('promise-retry')
require('dotenv').config()

const http = require('http');
const PORT = process.env.PORT || 5000;
const { parse } = require('querystring');

const {
  MONGO_URL,
  MONGO_DB,
  MONGO_COMMENTS,
  REDIS_HOST
} = process.env

function main() {
  const connectOptions = {
    reconnectTries: 60,
    reconnectInterval: 1000,
    poolSize: 10,
    bufferMaxEntries: 0
  }

  const promiseRetryOptions = {
    retries: connectOptions.reconnectTries,
    factor: 1.5,
    minTimeout: connectOptions.reconnectInterval,
    maxTimeout: 5000
  }
  
  const connect = (url) => {
    console.log({ url })
    return promiseRetry((retry, number) => {
      console.log(`MongoClient connecting to ${url} - retry number: ${number}`)
      return MongoClient.connect(url, connectOptions).catch(retry)
    }, promiseRetryOptions)
  }
  
  connect(MONGO_URL).then((client) => {
    console.log("Mongo client connected.")
    console.log({client})

    const db = client.db(MONGO_DB)

    const commentsCollection = db.collection(MONGO_COMMENTS)

    const context = () => ({
      commentsDataSource: new MongoDBDataSource(commentsCollection),
    })


    const server = http.createServer(async (req, res) => {
      if (req.url === "/" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write("API");
        res.end();
      }

      if (req.url === "/api/comment" && req.method === "GET") {
        db.collection(MONGO_COMMENTS).find({}).toArray(function (err, result) {
          if (err) throw err;
          res.writeHead(200, { "Content-Type": "application/json" });
          res.write(JSON.stringify(result));
          res.end(JSON.stringify(result));
        });
      }

      else if (req.url.match(/\/api\/comment\/([0-9]+)/) && req.method === "DELETE") {
        try {
          const id = req.url.split("/")[3];
          var myquery = { id };
          db.collection(MONGO_COMMENTS).deleteOne(myquery, function (err, obj) {
            if (err) throw err;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.write("comment deleted successfully");
            res.end();
            db.close();
          });

        } catch (error) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: error }));
        }
      }

      else if (req.url === "/api/comment" && req.method === "POST") {
        console.log(req)
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          const payload = JSON.parse(body);
          const description = payload.description;
          var data = { commentId: Math.floor(4 + Math.random() * 10), description };
          db.collection(MONGO_COMMENTS).insertOne(data, function (err, result) {
            if (err) throw err;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.write("comment created successfully");
            res.end(JSON.stringify(result));
          });
        });
      }

      else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Route not found" }));
      }
    });

    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      cacheControl: {
        defaultMaxAge: 3
      },
      cache: new RedisCache({
        host: REDIS_HOST
      }),
      plugins: [responseCachePlugin()],
      context: context
    })

    server.listen(PORT,  () => {
      console.log(`🚀server started on port: ${PORT}`);
    });
    apolloServer.listen().then(({url}) => {
      console.log(`🚀 Server ready at ${url}`) 
    })
  })
}

main()








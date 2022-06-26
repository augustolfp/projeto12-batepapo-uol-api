import express, {json} from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import joi from 'joi';
dotenv.config();

const userSchema = joi.object({
    name: joi.string().required(),
    lastStatus: joi.number().integer().required()
});

const messageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required(),
    time: joi.string().required()
})

import { MongoClient } from 'mongodb';
import { appendFile } from 'fs';

const server = express();
server.use(cors());
server.use(json());

let db;
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect(() => {
    db = mongoClient.db('chat_UOL');
});

server.listen(5000);
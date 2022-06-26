import express, {json} from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import joi from 'joi';
dotenv.config();

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
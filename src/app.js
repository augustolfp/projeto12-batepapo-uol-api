import express, {json} from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';
import joi from 'joi';

dotenv.config();

const userSchema = joi.object({
    name: joi.string().required()
});

const messageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required(),
    time: joi.string().required()
})

const server = express();
server.use(cors());
server.use(json());

let db;
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect(() => {
    db = mongoClient.db("chat_UOL");
});

server.post('/participants', async (req, res) => {
    const userName = req.body;
    const validation = userSchema.validate(userName);

    if(validation.error) {
        console.log(validation.error.details);
        res.sendStatus(422);
        return;
    }
    
    const userAlreadyExists = await db.collection('participants').findOne(userName);
    if(userAlreadyExists) {
        console.log("Esse nome de usuário já está sendo utilizado!");
        res.sendStatus(409);
        return;
    }

    try {
        await db.collection('participants').insertOne({...userName, lastStatus: Date.now()});
        res.sendStatus(201);
    }
    catch(error) {
        res.sendStatus(422);
    }
});

server.get('/participants', async (req, res) => {
    try {
        const participants = await db.collection('participants').find().toArray();
        res.send(participants);
    }
    catch(error) {
        res.sendStatus(422);
    }
})

server.listen(5000);
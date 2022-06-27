import express, {json} from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';
import joi from 'joi';
import dayjs from 'dayjs';

dotenv.config();

const userSchema = joi.object({
    name: joi.string().required()
});

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message','private_message').required(),
})

const server = express();
server.use(cors());
server.use(json());

let db;
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect(() => {
    db = mongoClient.db("chat_UOL");
});

async function kickInactiveUsers() {
    const tenSecondsAgo = Date.now() - 10*1000;
    const inactiveUsers = await db.collection('participants').find({lastStatus: {$lt: tenSecondsAgo}}).toArray();
    await db.collection('participants').deleteMany({lastStatus: {$lt: tenSecondsAgo}});
    inactiveUsers.map(user => {
        db.collection('messages').insertOne({
            from: user.name,
            to: 'Todos',
            text: 'sai na sala...',
            type: 'status',
            time: dayjs(Date.now()).format('HH:mm:ss')
        });
    })
}

//kickInactiveUsers();
setInterval(kickInactiveUsers, 15*1000);

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
        res.sendStatus(409);
        return;
    }

    try {
        const insertUser = await db.collection('participants').insertOne({...userName, lastStatus: Date.now()});
        const insertedUser = await db.collection('participants').findOne({_id: insertUser.insertedId});
        await db.collection('messages').insertOne({
            from: insertedUser.name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs(insertedUser.lastStatus).format('HH:mm:ss')
        });
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
});

server.get('/messages', async (req, res) => {
    let limit;
    req.query.limit ? limit = parseInt(req.query.limit) : limit = 0;
    const user = req.headers.user;
    

    try {
        const messages = await db.collection('messages').find({
            $or: [
                {
                    type: 'message'
                },
                {
                    type: 'status'
                },
                {
                    $and: [
                        {
                            type: 'private_message'
                        },
                        {
                            $or: [
                                {
                                    from: user
                                },
                                {
                                    to: user
                                }
                            ]
                        }
                    ]
                }
            ]
        }).sort({_id:-1}).limit(limit).toArray();
        res.send(messages.reverse());
    }
    catch(error) {
        res.sendStatus(422);
    }
});

server.post('/messages', async (req, res) => {
    const newMessage = req.body;
    const validation = messageSchema.validate(newMessage);
    const user = req.headers.user;
    const isValidUser = await db.collection('participants').findOne({name: user});

    if(validation.error) {
        console.log(validation.error.details);
        res.sendStatus(422);
        return;
    }
    if(!isValidUser) {
        res.sendStatus(422);
        return;
    }
    try {
        const insertMessage = await db.collection('messages').insertOne({...newMessage, from: user, time: dayjs(Date.now()).format('HH:mm:ss')});
        res.sendStatus(201);
    }
    catch(error) {
        res.sendStatus(500);
    }

});

server.post('/status', async (req, res) => {
    const user = req.headers.user;
    const isValidUser = await db.collection('participants').findOne({name: user});

    if(!isValidUser) {
        res.sendStatus(404);
        return;
    }
    try {
        await db.collection('participants').updateOne({name: user}, {$set: {lastStatus: Date.now()}});
        res.sendStatus(200);
    }
    catch(error) {
        res.sendStatus(500);
    }
})

server.listen(5000);
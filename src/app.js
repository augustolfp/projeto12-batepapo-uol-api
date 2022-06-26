import express, {json} from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

import { MongoClient } from 'mongodb';

const server = express();
server.use(cors());
server.use(json());


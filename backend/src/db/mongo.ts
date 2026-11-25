import mongoose from 'mongoose';
import { env } from '../config/env';

/** Conecta o Mongoose ao MongoDB (catálogo de livros). */
export async function conectarMongo() {
  await mongoose.connect(env.MONGO_URL);
  return mongoose.connection;
}

export { mongoose };

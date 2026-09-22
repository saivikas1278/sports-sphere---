import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Use POSTGRES_URI from .env, fallback to a local default for dev
const POSTGRES_URI = process.env.POSTGRES_URI || 'postgres://postgres:password@localhost:5432/sportsphere';

const sequelize = new Sequelize(POSTGRES_URI, {
  dialect: 'postgres',
  logging: false, // Set to true for SQL query logging
});

export default sequelize;

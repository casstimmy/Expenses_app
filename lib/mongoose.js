import mongoose from "mongoose";

export async function mongooseConnect() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }
    
    if (!process.env.MONGODB_URI) {
        throw new Error('Missing MONGODB_URI environment variable');
    }
    
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'test'
        });
        return mongoose.connection;
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        throw error;
    }
}
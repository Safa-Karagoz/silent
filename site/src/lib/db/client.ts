import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

const uri = process.env.MONGODB_URI;

const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
}

let client: MongoClient;

if (process.env.NODE_ENV === "development") {
    let globalWithMongo = global as typeof globalThis & {
        _mongoClient?: MongoClient
    }
    
    if (!globalWithMongo._mongoClient) {
        try {
            globalWithMongo._mongoClient = new MongoClient(uri, options);
            await globalWithMongo._mongoClient.connect();
            console.log("MongoDB connection test successful");
        } catch (error) {
            console.error("MongoDB connection test failed:", error);
            throw error;
        }
    }
    client = globalWithMongo._mongoClient;
} else {
    client = new MongoClient(uri, options);
}

export default client;
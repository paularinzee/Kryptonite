import mongoose from "mongoose";
import { configDotenv } from "dotenv";
configDotenv();

const CONNECTION_STRING = 'mongodb://localhost:27017/kryptonite'

// const CONNECTION_STRING = `mongodb+srv://arinzennajipaul:g4DunSWfYMqwcFMx@cluster0.wroan.mongodb.net/kryptonite?retryWrites=true&w=majority`
// const CONNECTION_STRING = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_USERNAME}@cluster0.wroan.mongodb.net/kryptonite?retryWrites=true&w=majority`
const connect_db = async() => {
    try {
        await mongoose.connect(CONNECTION_STRING)
        .then((connected) => console.log(`Database Connected ${connected.connection.name} ${connected.connection.host}`))
        
    } catch (error: unknown | any) {
        console.log(error.name, error.message)
    }
}

export default connect_db
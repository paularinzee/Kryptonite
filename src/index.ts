import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import connect_db from './config/config';
import user_route from './routes/User';
import user_image from './routes/Image';
import errorHandler from './middlewares/error-handler.middleware';
import CustomError from './error/custom-error';
// configures dotenv to work in your application
dotenv.config();
connect_db();

const app = express();

const PORT = process.env.PORT;
app.use(express.json());
app.use('/api/v1/user', user_route);
app.use('/api/v1/user-image', user_image);

// DEFAULT ROUTE
app.use('*', (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(`Oops...., It seems like the Route ${req.originalUrl} You are looking for does not Exist`, 404);
  next(error);
});

app.use(errorHandler);

app.listen(PORT, () => { 
  console.log("Server running at PORT: ", PORT); 
}).on("error", (error) => {
  // gracefully handle error
  throw new Error(error.message);
});
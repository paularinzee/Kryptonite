import User from '../models/User';
import { Request, Response, NextFunction } from 'express';

const validate_api_key = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const api_key = req.headers['x-api-key'];

    try {
        if (api_key === undefined) {
            res.status(401).json({
                status: 'fail',
                message: 'You are unauthorized'
            });
            return;
        }
        const user = await User.findOne({ api_key: api_key });
        // console.log(user);
        if (user === null) {
            res.status(401).json({
                status: 'fail',
                message: 'Unauthorized'
            });
            return;
        }
        res.locals.user = user._id;
        console.log(res.locals.user);
        next();
    } catch (error: any | unknown) {
        res.status(500).json({
            status: 'fail',
            message: error.message,
            name: error.name,
            stack: error.stack
        });
    }
};

export default validate_api_key;
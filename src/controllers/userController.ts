import { Request, Response, NextFunction } from 'express';
import user_service from '../services/user.service';
import user_service_login from '../services/user.login.service';
import IUser from '../interfaces/user.interface';
import sendEmail from '../email/user-verification.email';
import generate_otp from '../helper/otp-service.helper';

class UserController {
    async register_user(req: Request, res: Response, next: NextFunction): Promise<void> {
        const user_data: IUser = req.body;
        try {
            if (!user_data.first_name || !user_data.last_name || !user_data.email || !user_data.password || !user_data.confirm_password) {
                res.status(400).json({
                    status: 'failed',
                    message: 'All fields are required'
                });
                return;
            }

            if (user_data.password !== user_data.confirm_password) {
                res.status(400).json({
                    status: 'failed',
                    message: 'Passwords do not match'
                });
                return;
            }

            if (user_data.password.length < 8) {
                res.status(400).json({
                    status: 'failed',
                    message: 'Password must be at least 8 characters long'
                });
                return;
            }
            const email_exists = await user_service.find_user(user_data.email);
            if (email_exists) {
                res.status(400).json({
                    status: 'failed',
                    message: 'Email already exists'
                });
                return;
            }

            const user = await user_service.register_user(user_data);
            const reset_url = `${req.protocol}://${req.get('host')}/api/v1/user/activate-account/${user.active_token}`;
            await sendEmail({
                email: user.email,
                subject: 'Email Verification',
                message: `Please click on the link to verify your email:\n\n${reset_url}`
                // content: `Thank You`
            });
            res.status(200).json({
                status: 'success',
                message: 'Check Your email to Activate your account'
            });
        } catch (error: any) {
            // res.status(500).json({
            //     status: 'failed',
            //     message: error.message,
            //     name: error.name,
            //     stack: error.stack
            // });
            next(error);
        }
    }

    // login user
    async login_user(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                 res.status(400).json({
                    status: 'failed',
                    message: 'All fields are required'
                });
                return;
            }
            const { token, user } = await user_service_login.login_user(email, password);
            res.status(200).json({
                status: 'success',
                data: [
                    {
                        token,
                        first_name: user.first_name
                    }
                ]
            });
        } catch (error: any) {
            res.status(500).json({
                status: 'failed',
                message: error.message,
                name: error.name,
                stack: error.stack
            });
        }
    }
    async get_all_users(req: Request, res: Response) {
        const users = await user_service.get_all_users();
        res.status(200).json({
            status: 'success',
            data: users
        });
    }

    async delete_users(req: Request, res: Response) {
        const deleted_users = await user_service.delete_users();
        res.status(200).json({
            status: 'success',
            data: deleted_users
        });
    }
    async validate_token(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.params;
            const user = await user_service.validate_token(token);
            if (!user) {
                 res.status(400).json({
                    status: 'failed',
                    message: 'Invalid token'
                });
                return;
            }
            user.active = true;
            user.active_token = '';
            await user.save();
            res.status(200).json({
                status: 'success',
                message: 'Account Successfully Activated....'
            });
        } catch (error: unknown | any) {
            res.status(500).json({
                status: 'failed',
                message: error.message,
                name: error.name,
                stack: error.stack
            });
        }
    }

    async send_otp(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            const user = await user_service.find_user(email);
            if (!user) {
                 res.status(400).json({
                    status: 'failed',
                    message: 'User not found'
                });
                return;
            }
            if (user.active === false) {
                 res.status(400).json({
                    status: 'failed',
                    message: 'Account not activated, Kindly activate your account to be able to proceed'
                });
                return;
            }
            const otp = generate_otp();
            const five_mins = 1 * 60 * 1000;
            const now = new Date();
            user.otp_expire = new Date(now.getTime() + five_mins);
            user.otp = otp;
            console.log(user.otp);
            user.save();
            await sendEmail({
                email: user.email,
                subject: 'One Time Password',
                message: `Kindly use the OTP provided for you below\n\n ${otp}\n\nPlease Note that it will expire in 5mins`
            });
            res.status(200).json({
                status: 'success',
                message: 'OTP sent to your email'
            });
        } catch (error: unknown | any) {
            res.status(500).json({
                status: 'failed',
                message: error.message,
                name: error.name,
                stack: error.stack
            });
        }
    }
    async validate_otp(req: Request, res: Response): Promise<void> {
        try {
            const { otp } = req.body;
            if (!otp) {
                res.status(400).json({
                    status: 'failed',
                    message: 'OTP is required'
                });
                return;
            }
            const user = await user_service.validate_otp(otp);
            if (!user) {
                res.status(400).json({
                    status: 'failed',
                    message: 'Invalid OTP'
                });

                return;
            }
            res.status(200).json({
                status: 'success',
                message: 'OTP Verified Successfully....'
            });
            user.otp = undefined;
            user.otp_expire = undefined;
            await user.save();
        } catch (error: unknown | any) {
            res.status(500).json({
                status: 'failed',
                message: error.message,
                name: error.name,
                stack: error.stack
            });
        }
    }

    async generate_api_key(req: Request, res: Response): Promise<void> {
        try {
            const { user } = res.locals;
            if (!user) {
                res.status(400).json({
                    status: 'failed',
                    message: 'Email is required'
                });

                return;
            }
            const user_email = await user_service.find_user(user);
            if (!user_email) {
                res.status(400).json({
                    status: 'failed',
                    message: 'User not found'
                });
                return;
            }
            const api_key = await user_service.generate_api_key(user_email);
            console.log(api_key);
            res.status(200).json({
                status: 'success',
                data: api_key.api_key
            });
        } catch (error: unknown | any) {
            res.status(500).json({
                status: 'failed',
                message: error.message,
                name: error.name,
                stack: error.stack
            });
        }
    }

    async view_api_key(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({
                    status: 'failed',
                    message: 'Email is required'
                });
                return;
            }
            const user = await user_service.find_user(email);
            if (!user) {
                res.status(400).json({
                    status: 'failed',
                    message: 'User not found'
                });
                return;
            }
            if (user.api_key === undefined) {
                res.status(200).json({
                    status: 'fail',
                    message: 'API Key not generated'
                });

                return;
            }
            console.log(user);
            res.status(200).json({
                status: 'success',
                data: user.api_key
            });
        } catch (error: unknown | any) {
            res.status(500).json({
                status: 'failed',
                message: error.message,
                name: error.name,
                stack: error.stack
            });
        }
    }

    async delete_api_key(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({
                    status: 'failed',
                    message: 'Email is required'
                });
                return;
            }
            const user = await user_service.find_user(email);
            if (!user) {
                res.status(400).json({
                    status: 'failed',
                    message: 'User not found'
                });
                return;
            }
            user.api_key = undefined;
            await user.save();
            res.status(200).json({
                status: 'success',
                message: 'API Key deleted successfully'
            });
        } catch (error: unknown | any) {
            res.status(500).json({
                status: 'failed',
                message: error.message,
                name: error.name,
                stack: error.stack
            });
        }
    }
}

export default new UserController();
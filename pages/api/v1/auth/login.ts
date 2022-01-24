import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import getDate from '../../../../lib/date';
import UserModel from '../../../../models/user';
import UserSessionModel from '../../../../models/user/session';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export default async function handler( req: NextApiRequest, res: NextApiResponse ) {
    const { username, password } = req.body;
    const dateNow = getDate();
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userBrowser = req.headers["user-agent"] || 'none';
    const responseStatus = {
        'status': 400,
        'error': {
            'message': 'something wrong'
        }
    }
    const responseResult: any = {}

    if (req.method === 'POST') {
        await dbConnect();

        if (username && password) {
            const getUser = await UserModel.findOne({ username: username });
            if (getUser) {
                const password_data = getUser['password'];
                const isPasswordRight = await bcrypt.compare(password, password_data);
                if (isPasswordRight) {
                    const oneDayTime = 60 * 60 * 24 * 1000;
                    const createUserSession = await UserSessionModel.create({
                        user: getUser._id,
                        key: uuidv4(),
                        ip: ipAddress,
                        detail: userBrowser,
                        expire_at: dateNow + oneDayTime,
                        create_at: dateNow,
                        update_at: dateNow
                    });
                    
                    if (createUserSession) {
                        responseStatus.status = 200;
                        responseResult.user_id = getUser._id;
                        responseResult.username = getUser.username;
                        responseResult.avatar = getUser.avatar;
                        responseResult.auth = createUserSession.key;
                    }

                } else {
                    responseStatus.status = 401;
                    responseStatus.error.message = 'invalid username or password, please try again';
                }
            } else {
                responseStatus.status = 401;
                responseStatus.error.message = 'invalid username or password, please try again';
            }
        
        } else {
            responseStatus.status = 400;
            responseStatus.error.message = 'username and password is required, please try again';
        }
    
        if (responseStatus.status != 200) {
            responseResult.error = responseStatus.error;
        }
    
        res.status(responseStatus.status).json(responseResult);
    } else if (req.method == "OPTIONS") {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end();
    } else {
        res.status(405).end();
    }
}

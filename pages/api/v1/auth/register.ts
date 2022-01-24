import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import getDate from '../../../../lib/date';
import UserModel from '../../../../models/user';

export default async function handler( req: NextApiRequest, res: NextApiResponse ) {
    const { username, password } = req.body;
    const dateNow = getDate();
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
            if (!getUser) {
                const createUser = await UserModel.create({
                    username: username,
                    password: password,
                    avatar: 'none',
                    update_at: dateNow,
                    create_at: dateNow
                });
                if (createUser) {
                    responseStatus.status = 200;
                    responseResult.username = createUser.username;
                    responseResult.avatar = createUser.avatar;
                }
            } else {
                responseStatus.status = 403;
                responseStatus.error.message = 'username already used, please try again';
            }
        
        } else {
            responseStatus.status = 400;
            responseStatus.error.message = 'username and password is required, please try again';
        }
    
        if (responseStatus.status != 200) {
            responseResult.error = responseStatus.error;
        }
    
        res.status(responseStatus.status).json(responseResult);
    } else {
        res.status(405).end();
    }
}

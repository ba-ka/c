import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import getDate from '../../../../lib/date';
import UserSessionModel from '../../../../models/user/session';
import { v4 as uuidv4 } from 'uuid';

export default async function handler( req: NextApiRequest, res: NextApiResponse ) {
    const { auth } = req.body;
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

        if (auth) {
            const getUserSession = await UserSessionModel.findOne({ key: auth });
            if (getUserSession) { 
                responseStatus.status = 200;
                responseResult.id = getUserSession.user;
                responseResult.active = false;
                if (getUserSession.expire_at >= dateNow) {
                    responseResult.active = true;
                }
            } else {
                responseStatus.status = 401;
                responseStatus.error.message = 'auth not valid or expired';
            }
        
        } else {
            responseStatus.status = 400;
            responseStatus.error.message = 'auth is required, please try again';
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

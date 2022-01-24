import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import getDate from '../../../../lib/date';
import UserModel from '../../../../models/user';
import UserSessionModel from '../../../../models/user/session';
import KamiModel from '../../../../models/kami';
import { Types } from 'mongoose';

function isValidObjectId(id: string){
    if(Types.ObjectId.isValid(id)){
        if((String)(new Types.ObjectId(id)) === id)
            return true;        
        return false;
    }
    return false;
}

export default async function handler( req: NextApiRequest, res: NextApiResponse ) {
    const auth: string = req.query.auth as string;
    const dateNow = getDate();
    const responseStatus = {
        'status': 400,
        'error': {
            'message': 'something wrong'
        }
    }
    const responseResult: any = {}

    let isLoggedIn = false;
	let idLogin;

    await dbConnect();

	if (auth) {
		const userSession = await UserSessionModel.findOne({ key: auth, expire_at: { $gte: dateNow } });
		if (userSession) {
			isLoggedIn = true;
			idLogin = userSession.user.toString();
		}
	}

    if (req.method === 'GET') {
        const username: string = req.query.username as string;
	    const kamiId: string = req.query.id as string;

        if (kamiId) {
            let getKami: any;
            if (isValidObjectId(kamiId)) {
                if(isLoggedIn) {
                    getKami = await KamiModel.findOne({ $or:[ {'status': 'public'}, {'status': 'unlist'}, {'status': 'profile'}, {'status': 'private'} ], $and: [{ _id: kamiId }, { author: idLogin }]} );
                } else {
                    getKami = await KamiModel.findOne({ $or: [{'status': 'public'}, {'status': 'profile'}, {'status': 'unlist'}], $and: [{_id: kamiId}]}).orFail().catch( () => { console.log('your document not found') }).then();
                }
                
            }
            if (getKami) {
                responseStatus.status = 200;
                responseResult.id = getKami._id;
                responseResult.title = getKami.title;
                responseResult.content = getKami.content;
                responseResult.status = getKami.status;
                responseResult.author = getKami.author;
                responseResult.excerpt = getKami.excerpt;
            } else {
                responseStatus.status = 400;
                responseStatus.error.message = 'kami not found';
            }
        } else if (username) {
            const getUser = await UserModel.findOne({ username: username });
            if (getUser) {
                let getKami: any;
                
                if(isLoggedIn) {
                    if (idLogin == getUser._id.toString()) {
                        getKami = await KamiModel.find({ $or:[ {'status': 'public'}, {'status': 'unlist'}, {'status': 'profile'}, {'status': 'private'} ], $and: [{ author: getUser._id }]} );
                    }
                } else {
                    getKami = await KamiModel.find({ $or:[ {'status': 'public'}, {'status': 'profile'} ], $and: [{ author: getUser._id }]} );
                }
                
                if (getKami) {
                    responseStatus.status = 200;
                    responseResult.row = getKami;
                } else {
                    responseStatus.status = 400;
                    responseStatus.error.message = 'kami not found';
                }
            }
        } else {
            const getKami: any = await KamiModel.find({ status: 'public' });
            if (getKami) {
                responseStatus.status = 200;
                responseResult.row = getKami;
            } else {
                responseStatus.status = 400;
                responseStatus.error.message = 'kami not found';
            }
        }
    
    } else if (req.method === "POST") {
        const { title, excerpt, status, content, auth } = req.body;

        if (title && excerpt && status && content && auth) {
            const userSession = await UserSessionModel.findOne({ key: auth, expire_at: { $gte: dateNow } });
            if (userSession) {
                const createKami = await KamiModel.create({
                    title: title,
                    excerpt: excerpt,
                    content: content,
                    status: status,
                    author: userSession.user,
                    update_at: dateNow,
                    create_at: dateNow
                });
                
                if (createKami) {
                    responseStatus.status = 200;
                    responseResult.id = createKami._id;
                    responseResult.title = createKami.title;
                    responseResult.excerpt = createKami.excerpt;
                    responseResult.content = createKami.content;
                    responseResult.status = createKami.status;
                }
            } else {
                responseStatus.status = 401;
                responseStatus.error.message = 'auth not valid or expired';
            }
        } else {
            responseStatus.status = 400;
            responseStatus.error.message = 'title, excerpt, content, status, auth is required, please try again';
        }

    } else if (req.method === "PUT") {
        const { id, title, excerpt, status, content, auth } = req.body;

        if (id && title && excerpt && status && content && auth) {
            const userSession = await UserSessionModel.findOne({ key: auth, expire_at: { $gte: dateNow } });
            if (userSession) {
                const updateKami = await KamiModel.updateOne({
                    _id: id
                },{
                    title: title,
                    excerpt: excerpt,
                    content: content,
                    status: status,
                    update_at: dateNow
                }).then((result) => {
                    responseStatus.status = 200;
                    responseResult.id = id;
                    responseResult.title = title;
                    responseResult.excerpt = excerpt;
                    responseResult.content = content;
                    responseResult.status = status;
                }).catch((error) => {
                    console.log(error.Message);
                });
            } else {
                responseStatus.status = 401;
                responseStatus.error.message = 'auth not valid or expired';
            }
        } else {
            responseStatus.status = 400;
            responseStatus.error.message = 'title, excerpt, content, status, auth is required, please try again';
        }
    }

    if (responseStatus.status != 200) {
        responseResult.error = responseStatus.error;
    }

    if (req.method == "OPTIONS") {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end();
    } else {
        res.status(responseStatus.status).json(responseResult);
    }
}

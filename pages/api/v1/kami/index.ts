import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import getDate from '../../../../lib/date';
import UserModel from '../../../../models/user';
import UserSessionModel from '../../../../models/user/session';
import KamiModel from '../../../../models/kami';
import { isValidObjectId } from '../../../../lib/util';

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

    function safeData(getKami: any) {
        let newKami: any = [];
		
        for (let i = 0; i < getKami.length; i++) {
            const tempAuthor: any = {
                id: getKami[i].author._id,
                username: getKami[i].author.username
            }

            const tempData = {
                id: getKami[i]._id,
                title: getKami[i].title,
                excerpt: getKami[i].excerpt,
                status: getKami[i].status,
                update_at: getKami[i].update_at,
                create_at: getKami[i].create_at,
                author: tempAuthor
            }

            newKami.push(tempData);
        }

        return newKami;
    }

    function safeDataSingle(getKami: any) {
        const tempAuthor: any = {
            id: getKami.author._id,
            username: getKami.author.username
        }

        const tempData = {
            id: getKami._id,
            title: getKami.title,
            excerpt: getKami.excerpt,
            content: getKami.content,
            status: getKami.status,
            update_at: getKami.update_at,
            create_at: getKami.create_at,
            author: tempAuthor
        }

        return tempData;
    }

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
        const userid: string = req.query.userid as string;
	    const kamiId: string = req.query.id as string;

        if (kamiId) {
            let getKami: any;
            if (isValidObjectId(kamiId)) {
                if(isLoggedIn) {
                    getKami = await KamiModel.findOne({ $or:[ {'status': 'public'}, {'status': 'unlist'}, {'status': 'profile'}, {'status': 'private'} ], $and: [{ _id: kamiId }, { author: idLogin }]} ).populate('author');
                }
                
                if (!getKami) {
                    getKami = await KamiModel.findOne({ $or: [{'status': 'public'}, {'status': 'profile'}, {'status': 'unlist'}], $and: [{_id: kamiId}]}).populate('author');
                }
            }
            if (getKami) {
                getKami = safeDataSingle(getKami);
                responseStatus.status = 200;
                responseResult.id = getKami.id;
                responseResult.title = getKami.title;
                responseResult.content = getKami.content;
                responseResult.status = getKami.status;
                responseResult.author = getKami.author;
                responseResult.excerpt = getKami.excerpt;
                responseResult.update_at = getKami.update_at;
                responseResult.create_at = getKami.create_at;
            } else {
                responseStatus.status = 400;
                responseStatus.error.message = 'kami not found';
            }
        } else if (userid) {
            const getUser = await UserModel.findOne({ _id: userid });
            if (getUser) {
                let getKami: any;
                
                if(isLoggedIn && idLogin == getUser._id.toString()) {
                    getKami = await KamiModel.find({ $or:[ {'status': 'public'}, {'status': 'unlist'}, {'status': 'profile'}, {'status': 'private'} ], $and: [{ author: getUser._id }]} ).populate('author');
                } else {
                    getKami = await KamiModel.find({ $or:[ {'status': 'public'}, {'status': 'profile'} ], $and: [{ author: getUser._id }]} ).populate('author');
                }

                if (getKami) {
                    responseStatus.status = 200;
                    responseResult.row = safeData(getKami);
                } else {
                    responseStatus.status = 400;
                    responseStatus.error.message = 'kami not found';
                }
            }
        } else if (username) {
            const getUser = await UserModel.findOne({ username: username });
            if (getUser) {
                let getKami: any;
                
                if(isLoggedIn && idLogin == getUser._id.toString()) {
                    getKami = await KamiModel.find({ $or:[ {'status': 'public'}, {'status': 'unlist'}, {'status': 'profile'}, {'status': 'private'} ], $and: [{ author: getUser._id }]} ).populate('author');
                } else {
                    getKami = await KamiModel.find({ $or:[ {'status': 'public'}, {'status': 'profile'} ], $and: [{ author: getUser._id }]} ).populate('author');
                }
                
                if (getKami) {
                    responseStatus.status = 200;
                    responseResult.row = safeData(getKami);
                } else {
                    responseStatus.status = 400;
                    responseStatus.error.message = 'kami not found';
                }
            }
        } else {
            const getKami: any = await KamiModel.find({ status: 'public' }).populate('author');
            if (getKami) {
                responseStatus.status = 200;
                responseResult.row = safeData(getKami);
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
                    responseResult.update_at = dateNow;
                    responseResult.create_at = dateNow;
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
                if (isValidObjectId(id)) {
                    const updateKami = await KamiModel.findOneAndUpdate({
                        _id: id,
                        author: userSession.user
                    },
                    {
                        title: title,
                        excerpt: excerpt,
                        content: content,
                        status: status,
                        update_at: dateNow
                    },
                    {
                        new: true // or returnOriginal: false
                    });
                    
                    if (updateKami) {
                        responseStatus.status = 200;
                        responseResult.id = updateKami._id;
                        responseResult.title = updateKami.title;
                        responseResult.excerpt = updateKami.excerpt;
                        responseResult.content = updateKami.content;
                        responseResult.status = updateKami.status;
                        responseResult.update_at = updateKami.update_at;
                        responseResult.create_at = updateKami.create_at;
                    }
                } else {
                    responseStatus.status = 400;
                    responseStatus.error.message = 'kami not found';
                }
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

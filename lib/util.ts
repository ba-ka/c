import { Types } from 'mongoose';

export function isValidObjectId(id: string){
    if(Types.ObjectId.isValid(id)){
        if((String)(new Types.ObjectId(id)) === id)
            return true;        
        return false;
    }
    return false;
}
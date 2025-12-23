// Para que TypeScript reconozca req.userId
declare namespace Express {
    interface Request {
        userId?: string;
    }
}

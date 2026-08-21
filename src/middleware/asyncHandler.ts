import { Request, RequestHandler, Response } from "express";

export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

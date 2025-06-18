import { withCORS } from "../utils/with-cors";
import type { ValidationResponse } from "./properties";


export const validateProperties = (properties: string[], validators: ((val: string) => ValidationResponse)[])=>{
    const errors: ValidationResponse[] = [];
    
    properties.forEach((property, index) => {
        const validator = validators[index];
        if (validator) {
        const error = validator(property);
        if (error) {
            errors.push(error);
        }
        }
    });
    if (errors.length > 0) {
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };
        return withCORS(Response.json({ errors }, { status: 400, headers }), 400);
    }
}
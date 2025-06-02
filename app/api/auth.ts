import { createHmac } from 'node:crypto'
import jwt from "jsonwebtoken";
const secret = process.env.AUTH_SECRET || 'default_secret'
const jwtSecret = process.env.JWT_SECRET || 'default_secret'

const refreshTokenDuration = 1296000000 // 15 days in ms
const accessTokenDuration = 3600000 // 1 hour in ms

type TokenData = { sub: string, iat: number, exp: number, publicUsername: string }

export const getUserCredentials = (username: string, password: string) => {
    const userId = createHmac('sha256', secret).update(username + password).digest('hex')
    const userIdB64 = Buffer.from(userId, 'hex').toString('base64')
    const shortHash = userId.slice(0, 4)
    const publicUsername = `${username}#${shortHash}`
    const currTS = Date.now();
    const refreshToken = jwt.sign({
        sub: userIdB64,
        publicUsername,
        iat: currTS,
        exp: currTS + refreshTokenDuration,
    }, jwtSecret)
    return {
        publicUsername,
        userIdB64,
        userId,
        refreshToken
    }
}

export const getAccessToken = (refreshJwt: string): ['Token expired' | "Invalid refresh token", null ] | [null, string] => {
    try {
        const decoded = jwt.verify(refreshJwt, jwtSecret) as TokenData
        const currTS = Date.now();
        if (decoded.exp < currTS) {
            return ['Token expired', null]
        }
        const accessToken = jwt.sign({
            sub: decoded.sub,
            publicUsername: decoded.publicUsername,
            iat: currTS,
            exp: currTS + accessTokenDuration, // 1 hour
        }, jwtSecret)
        return [null, accessToken]
    } catch (error) {
        console.log("Error validating refresh token:", error)
       return ["Invalid refresh token", null]
    }
}

export const validateAccessToken = (accessJwt: string): ['Token expired' | "Invalid access token", null ] | [null, {
    userIdB64: string,
    publicUsername: string,
}] => {
    try {
        const decoded = jwt.verify(accessJwt, jwtSecret) as TokenData
        const currTS = Date.now();
        if (decoded.exp < currTS) {
            return ['Token expired', null]
        }
        return [null, {
            userIdB64: decoded.sub,
            publicUsername: decoded.publicUsername,
        }]
    } catch (error) {
       return ["Invalid access token", null]
    }
}
import { createHash } from 'node:crypto'

export function getPartition(stringId: string, N: number, salt: string = '') {
    // Create an MD5 hash of the stringId
    const hash = createHash('md5').update(stringId + salt).digest('hex');
    // Convert the hex hash to an integer
    const intHash = BigInt('0x' + hash);
    // Get the partition number
    const partition = Number(intHash % BigInt(N));
    return partition;
}

export function createDeferredPromise() {
    let resolve:any, reject: any;
    
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve: resolve as (...args:any)=> void, reject: reject as (...args:any)=> void};
}
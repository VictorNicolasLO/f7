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
    let resolve: any, reject: any;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve: resolve as (...args: any) => void, reject: reject as (...args: any) => void };
}


export const createBatcher = (fn: (data: any[]) => Promise<void>, batchTime: number) => {
    let buffer: any = [];
    let timeout: NodeJS.Timeout | null;

    const onItem = (singleItem: any) => {
        return new Promise((resolve) => {
            buffer.push({ singleItem, resolve });

            if (!timeout) {
                timeout = setTimeout(() => {
                    const items = buffer.map((item: { singleItem: any; }) => item.singleItem);
                    fn(items).then(results => {
                        buffer.forEach((item:{ singleItem: any, resolve: any }) => item.resolve());
                        buffer = [];
                        timeout = null;
                    });
                }, batchTime); // batch every 50ms
            }
        });
    }
    return {onItem}
}

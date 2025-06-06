export const startMemoryUsage = () => {
    setInterval(() => {
        const memoryUsage = process.memoryUsage();

        console.log("Memory Usage:");
        console.log(`RSS         : ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Heap Total  : ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Heap Used   : ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`External    : ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);
        if (memoryUsage.arrayBuffers !== undefined) {
            console.log(`Array Buffers: ${(memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`);
        }
    }, 10000)

}
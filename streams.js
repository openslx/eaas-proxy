class ReadableStream {
    constructor(underlyingSource = {
        start(controller) {},
        /** @param {ReadableStreamDefaultController} controller */
        pull(controller) {},
        cancel(reason) {},
    }, strategy = {}) {}

    get locked() {return false;}

    cancel(reason) {}
    getReader() {}
    pipeThrough({writable, readable}, options) {}
    pipeTo(dest, {
        preventClose = false,
        preventAbort = false,
        preventCancel = false,
    } = {}) {}
    tee() {}
}
class ReadableStreamDefaultReader {
    constructor(stream) {}

    get closed() {return Promise.resolve();}

    cancel(reason) {}
    read() {}
    releaseLock() {}
}
class ReadableStreamDefaultController {
    constructor() {} // always throws

    get desiredSize() {return 0;}

    close() {}
    enqueue(chunk) {}
    error(e) {}
}

class WritableStream {
    constructor(underlyingSink = {
        start(controller) {},
        write(chunk, controller) {},
        close() {},
        abort(reason) {},
    }, strategy = {}) {}

    get locked() {return false;}

    abort(reason) {}
    getWriter() {}
}
class WritableStreamDefaultWriter {
    constructor(stream) {}

    get closed() {return Promise.resolve();}
    get desiredSize() {return 0;}
    get ready() {return Promise.resolve();}

    abort(reason) {}
    close() {}
    releaseLock() {}
    write(chunk) {}
}
class WritableStreamDefaultController {
    constructor() {} // always throws

    error(e) {}
}

class ByteLengthQueuingStrategy {
    constructor({highWaterMark}) {}
    size(chunk) {}
}

class CountQueuingStrategy {
    constructor({highWaterMark}) {}
    size() {}
}

class TransformStream {
    constructor(transformer = {}, writableStrategy = {}, readableStrategy = {}) {}

    get readable() {return new ReadableStream();}
    get writable() {return new WritableStream();}
}
class TransformStreamDefaultController {
    constructor() {} // always throws

    get desiredSize() {return 0;}

    enqueue(chunk) {}
    error(reason) {}
    terminate() {}
}

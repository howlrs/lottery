require('@testing-library/jest-dom')
const { TextEncoder, TextDecoder } = require('util')
const { ReadableStream } = require('stream/web')
const { MessageChannel, MessagePort } = require('worker_threads')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream
global.MessageChannel = MessageChannel
global.MessagePort = MessagePort

const { Request, Response, Headers } = require('undici')

global.Request = Request
global.Response = Response
global.Headers = Headers

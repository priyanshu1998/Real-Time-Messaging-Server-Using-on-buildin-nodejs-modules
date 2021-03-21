"use strict";
exports.__esModule = true;
var http = require("http");
var crypto = require("crypto");
var fs = require("fs");
var http_server = http.createServer(function (req, res) {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream('index.html').pipe(res);
});
//Storing client as they connect
var clients = [];
var port = 8080;
http_server
    .listen(port, function () { return console.log("Server running at http://localhost:" + port + "."); });
http_server
    .on('upgrade', function (req, socket) {
    if (req.headers['upgrade'] !== 'websocket') {
        socket.end('HTTP/1.1 400 Bad Request');
        return;
    }
    /* Read the websocket key provided by the client "acceptKey"                                        --1
        Generate the response value to use in the response "generateAcceptValue"                        --2
            Write the HTTP response into an array of response lines: "responseHeaders"                  --3
                Write the response back to the client socket, being sure to append two
                additional newlines so that the browser recognises the end of the response
                header and doesn't continue to wait for more header data                                --4
    */
    var acceptKey = req.headers['sec-websocket-key']; //--1 
    var hash = generateAcceptValue(acceptKey); //--2
    var responseHeaders = ['HTTP/1.1 101 Web Socket Protocol Handshake', 'Upgrade: WebSocket', 'Connection: Upgrade', "Sec-WebSocket-Accept: " + hash]; //--3
    // Read the subprotocol from the client request headers:
    var protocol = req.headers['sec-websocket-protocol'];
    /* If provided, they'll be formatted as a comma-delimited string of protocol
    names that the client supports; we'll need to parse the header value, if
    provided, and see what options the client is offering:*/
    var protocols = !protocol ? [] : protocol.split(',').map(function (s) { return s.trim(); });
    // To keep it simple, we'll just see if JSON was an option, and if so, include
    // it in the HTTP response:
    if (protocols.includes('json')) {
        // Tell the client that we agree to communicate with JSON data
        responseHeaders.push("Sec-WebSocket-Protocol: json");
    }
    socket.write(responseHeaders.join('\r\n') + '\r\n\r\n'); //-4
    clients.push(socket);
    socket.on('data', function (buffer) {
        var message = parseMessage(buffer);
        if (message) {
            // For our convenience, so we can see what the client sent
            console.log(message);
            // socket.write(constructReply(message)); 
            broadcast(constructReply(message));
        }
        else if (message === null) {
            console.log('WebSocket connection closed by the client.');
        }
    });
    function broadcast(data) {
        clients.forEach(function (client) {
            client.write(data);
        });
    }
    ;
});
function generateAcceptValue(acceptKey) {
    return crypto
        .createHash('sha1')
        .update(acceptKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'utf8')
        .digest('base64');
}
function constructReply(data) {
    // Convert the data to JSON and copy it into a buffer
    var json = JSON.stringify(data);
    var jsonByteLength = Buffer.byteLength(json);
    // Note: we're not supporting > 65535 byte payloads at this stage 
    var lengthByteCount = jsonByteLength < 126 ? 0 : 2;
    var payloadLength = lengthByteCount === 0 ? jsonByteLength : 126;
    var buffer = Buffer.alloc(2 + lengthByteCount + jsonByteLength);
    // Write out the first byte, using opcode `1` to indicate that the message 
    // payload contains text data 
    buffer.writeUInt8(129, 0);
    buffer.writeUInt8(payloadLength, 1);
    // Write the length of the JSON payload to the second byte 
    var payloadOffset = 2;
    if (lengthByteCount > 0) {
        buffer.writeUInt16BE(jsonByteLength, 2);
        payloadOffset += lengthByteCount;
    }
    // Write the JSON data to the data buffer 
    buffer.write(json, payloadOffset);
    return buffer;
}
function parseMessage(buffer) {
    //   0                   1                   2                   3
    //   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    //  +-+-+-+-+-------+-+-------------+-------------------------------+
    //  |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
    //  |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
    //  |N|V|V|V|       |S|             |   (if payload len==126/127)   |
    //  | |1|2|3|       |K|             |                               |
    //  +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
    //  |     Extended payload length continued, if payload len == 127  |
    //  + - - - - - - - - - - - - - - - +-------------------------------+
    //  |                               |Masking-key, if MASK set to 1  |
    //  +-------------------------------+-------------------------------+
    //  | Masking-key (continued)       |          Payload Data         |
    //  +-------------------------------- - - - - - - - - - - - - - - - +
    //  :                     Payload Data continued ...                :
    //  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
    //  |                     Payload Data continued ...                |
    //  +---------------------------------------------------------------+
    // Opcode:  4 bits
    //     Defines the interpretation of the "Payload data".  If an unknown
    //     opcode is received, the receiving endpoint MUST _Fail the
    //     WebSocket Connection_.  The following values are defined.
    //     *  %x0 denotes a continuation frame
    //     *  %x1 denotes a text frame
    //     *  %x2 denotes a binary frame
    //     *  %x3-7 are reserved for further non-control frames
    //     *  %x8 denotes a connection close
    //     *  %x9 denotes a ping
    //     *  %xA denotes a pong
    //     *  %xB-F are reserved for further control frames
    /********************************************** Bit 0 - 7 ****************************************************************** */
    //argument in buffer.readUInt is the "offset number of bytes"
    var firstByte = buffer.readUInt8(0);
    var isFinalFrame = Boolean((firstByte >>> 7) & 0x1);
    var _a = [Boolean((firstByte >>> 6) & 0x1), Boolean((firstByte >>> 5) & 0x1), Boolean((firstByte >>> 4) & 0x1)], reserved1 = _a[0], reserved2 = _a[1], reserved3 = _a[2];
    var opCode = firstByte & 0xF;
    // We can return null to signify that this is a connection termination frame 
    if (opCode === 0x8)
        return null;
    // We only care about text frames from this point onward 
    if (opCode !== 0x1)
        return;
    /********************************************************************************************************************** */
    /*********************************************** Bit 8 - ??? ****************************************************************** */
    /* finding
        - payload size
        - ismask
        - mask key
    */
    var secondByte = buffer.readUInt8(1); //1 byte offset
    var isMasked = Boolean((secondByte >>> 7) & 0x1);
    // console.log("Masking bit is",isMasked)
    // Keep track of our current position as we advance through the buffer 
    var currentOffset = 2;
    var payloadLength = secondByte & 0x7F; //i.e 0b 0111 1111 (range 0-127)
    // Payload length:  7 bits, 7+16 bits, or 7+64 bits
    if (payloadLength > 125) {
        //If 126, the following 2 bytes interpreted as a 16-bit unsigned integer are the payload length.
        if (payloadLength === 126) {
            payloadLength = buffer.readUInt16BE(currentOffset);
            currentOffset += 2;
        }
        //If 127, the following 8 bytes interpreted as a 64-bit unsigned integer (the most significant bit MUST be 0) are the payload length.  Multibyte length quantities are expressed in network byte order.
        else {
            var leftPart = buffer.readUInt32BE(currentOffset);
            var rightPart = buffer.readUInt32BE(currentOffset += 4);
            // Honestly, if the frame length requires 64 bits, you're probably doing it wrong. 
            // In Node.js you'll require the BigInt type, or a special library to handle this. 
            throw new Error('Large payloads not currently implemented');
        }
    }
    var maskingKey = 0x0000;
    if (isMasked) {
        maskingKey = buffer.readUInt32BE(currentOffset);
        currentOffset += 4;
    }
    /********************************************************************************************************************** */
    //******************Payload Data ***************************************************************************************/
    // Allocate somewhere to store the final message data
    var data = Buffer.alloc(payloadLength);
    // Only unmask the data if the masking bit was set to 1
    if (isMasked) {
        // Loop through the source buffer one byte at a time, keeping track of which
        // byte in the masking key to use in the next XOR calculation
        for (var i = 0, j = 0; i < payloadLength; ++i, j = i % 4) {
            // Extract the correct byte mask from the masking key
            var shift = j == 3 ? 0 : (3 - j) << 3;
            var mask = (shift == 0 ? maskingKey : (maskingKey >>> shift)) & 0xFF;
            // Read a byte from the source buffer 
            var source = buffer.readUInt8(currentOffset++);
            // XOR the source byte and write the result to the data 
            data.writeUInt8(mask ^ source, i);
        }
    }
    else {
        // Not masked - we can just read the data as-is
        buffer.copy(data, 0, currentOffset++);
    }
    var json = data.toString('utf8');
    return JSON.parse(json);
}

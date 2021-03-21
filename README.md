# Real-Time-Messaging-Server-Using-only-buildin-nodejs-modules
An implementation from scratch using only following built-in modules (buffer, net, event, http, crypto and fs) and no 3rd party modules. 


####### Language: Typescript

### Motivation:
This was developed as a part of 4th Year 1st semester assigment and we given freedom to develop using any nodejs module.
I deciced to develop without any 3rd Party module.

In order to understand websocket protocol. I deciced to read rfc6455 (https://tools.ietf.org/html/rfc6455).
I kept researching and compact compact version of it. (https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers)



### Problem Statement:
    Write a multi-client chat application consisting of both client and server programs. 
    In this chat application simultaneously several clients can communicate with each other. For this you need a single server
    program that clients connect to. 
        
    The client programs send the chat text or image (input) to the server and then the server distributes that message (text or image) to all the other clients. 
    Each client then displays the message sent to it by the server. 
    The server should be able to handle several clients concurrently. It should work fine as clients come and go.
    Develop the application using a framework based on Node.JS. How are messages handled concurrently?
    Which web application framework(s) did you follow?

    Prepare a detailed report of the experiments you have done, and your observations on the protocol
    layers thus created.
 
### Execution
    # convert the server.ts into server.js file.
    tsc server.tsc

    # run server.js file
    nodejs server.js

### References: 

    1. https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
    2. https://medium.com/hackernoon/implementing-a-websocket-server-with-node-js-d9b78ec5ffa8

    3. https://nodejs.dev/learn
    4. https://wanago.io/     <- for typescript and nodejs tutorials.
    5. https://basarat.gitbook.io/typescript/nodejs

    6. Presentation given by Rohit(classmate), made high level abstraction a lot clearer. So I was able to understand the deeper details with ease.
        (In simple words saved a lot of time.)


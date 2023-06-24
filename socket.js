imoprt io
export let io;
 io = {
    init: httpServer => {
        io = require('socket.io')(httpServer,{
            cors: {
              origin: httpServer
            }
          });
        return io;
    },
    getIO: () => {
        if(!io){
            throw new Error('Socket.io is not initialized');
        }
        return io;
    }
}

export default io ;
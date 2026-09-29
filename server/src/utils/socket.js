let io;

module.exports = {
  init: (serverIo) => {
    io = serverIo;
  },
  getIo: () => {
    if (!io) {
      console.warn("Socket.io not initialized!");
    }
    return io;
  }
};

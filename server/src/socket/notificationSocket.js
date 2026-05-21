const connectedUsers = new Map();

const notificationSocket = (
  io
) => {
  io.on(
    "connection",
    (socket) => {
      socket.on(
        "register",
        (userId) => {
          connectedUsers.set(
            userId,
            socket.id
          );
        }
      );

      socket.on(
        "disconnect",
        () => {
          for (const [
            userId,
            socketId,
          ] of connectedUsers.entries()) {
            if (
              socketId ===
              socket.id
            ) {
              connectedUsers.delete(
                userId
              );
            }
          }
        }
      );
    }
  );
};

module.exports =
  notificationSocket;
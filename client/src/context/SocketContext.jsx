import {
  createContext,
  useContext,
} from "react";

const SocketContext =
  createContext();

export const SocketProvider = ({
  children,
}) => {
  return (
    <SocketContext.Provider
      value={{}}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () =>
  useContext(SocketContext);
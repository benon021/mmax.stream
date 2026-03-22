import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("mmax_user");
    return saved ? JSON.parse(saved) : { name: "Guest", isAuthenticated: false };
  });

  useEffect(() => {
    localStorage.setItem("mmax_user", JSON.stringify(user));
  }, [user]);

  const login = (name) => {
    setUser({ name: name || "User", isAuthenticated: true });
  };

  const logout = () => {
    setUser({ name: "Guest", isAuthenticated: false });
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

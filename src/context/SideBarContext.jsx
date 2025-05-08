import React, { createContext, useContext, useState } from 'react';

export const SideBarContext = createContext();

export const SideBarProvider = ({ children }) => {
  const [showSideBar, setShowSideBar] = useState(false);

  const toggleSideBar = () => {
    setShowSideBar((prev) => !prev);
  };

  return (
    <SideBarContext.Provider value={{ showSideBar, toggleSideBar }}>
      {children}
    </SideBarContext.Provider>
  );
}

export const useSideBar = () => useContext(SideBarContext);
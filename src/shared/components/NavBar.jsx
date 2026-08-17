import React from "react";
import "./NavBar.css";
import { useSideBar } from "../context/SideBarContext";

const Navbar = () => {
  const { toggleSideBar } = useSideBar();

  return (
    <div className="nav-bar">
      <div className="nav-logo-n-msg">
        <img src="./pauls-logo.png" alt=":)" className="nav-logo" />
        <p className="nav-msg">Welcome to Pauls Kitchen!</p>
      </div>
      <button onClick={toggleSideBar}>
        <img src="./menu.svg" alt="=" className="nav-menu" />
      </button>
    </div>
  );
};

export default Navbar;

import React from "react";
import "../styles/Navbar.css";

const Navbar = () => {
  return (
    <div className="nav-bar">
      <div className="nav-logo-n-msg">
        <img src="./cafe-logo.svg" alt=":)" className="nav-logo" />
        <p className="nav-msg">Welcome User</p>
      </div>
      <button>
        <img src="./menu.svg" alt="=" className="nav-menu" />
      </button>
    </div>
  );
};

export default Navbar;

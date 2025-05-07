import React from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = () => {
  return (
    <div className="nav-bar">
      <div className="nav-logo-n-msg">
        <img src="./cafe-logo.svg" alt=":)" className="nav-logo" />
        <p className="nav-msg">Welcome, Avneet Caafe!</p>
      </div>
      <Link to="/side-bar">
        <button>
          <img src="./menu.svg" alt="=" className="nav-menu" />
        </button>
      </Link>
    </div>
  );
};

export default Navbar;

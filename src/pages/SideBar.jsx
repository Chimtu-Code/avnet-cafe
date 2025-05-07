import React from "react";
import "../styles/Sidebar.css";
import { Link } from "react-router-dom";

const SideBar = () => {
  const sideBarOptions = [
    {
      text: "My Tokens",
      icon: "./tokens-icon.svg",
      link: "/my-tokens",
    },
    {
      text: "My Cart",
      icon: "./cart-icon.svg",
      link: "/cart",
    },
    {
      text: "Admin Login",
      icon: "./admin-icon.svg",
      link: "/admin-login",
    }
  ];

  const SideBarOption = ({ text, icon ,link }) => {
    return (
      <Link className="side-bar-option" to={link}>
        <img src={icon} alt={text} />
        <p>{text}</p>
        <img src="./right-arrow.svg" alt=">" className="sb-r-arw"/>
      </Link>
    );
  };

  return (
    <div className="side-bar">
      <div className="side-bar-header">
          <Link to="/">
            <img src="./back-arrow.svg" alt="Back" className="back-arw" />
          </Link>
          <p className="sb-title">Categories</p>
      </div>
      {sideBarOptions.map((option, index) => (
        <SideBarOption key={index} text={option.text} icon={option.icon} link={option.link}/>
      ))}
      <div className="side-bar-footer">
        <p>from</p>
        <img src="./company-logo.svg" alt="" />
      </div>
    </div>
  );
};

export default SideBar;

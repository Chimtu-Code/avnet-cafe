import React from "react";
import Card from "./Card";
import "../styles/MenuCategory.css";

const MenuCategory = ({ category, items }) => {
  return (
    <div className="menu-category">
      <h2>{category.name}</h2>
      {items.map((item) => (
        <Card key={item.id} item={item} />
      ))}
    </div>
  );
};

export default MenuCategory;

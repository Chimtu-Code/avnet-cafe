import { useState, React, useEffect } from "react";
import Navbar from "../components/Navbar";
import "../styles/Home.css";
import MenuCategory from "../components/MenuCategory";
import { supabase } from "../services/supabaseClient";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useSideBar } from "../context/SideBarContext";
import SideBar from "./SideBar";

const Home = () => {
  const { showSideBar } = useSideBar();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getTotalItems } = useCart();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);

      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*");

      if (categoryError) throw categoryError;

      const { data: itemData, error: itemError } = await supabase
        .from("items")
        .select("*");

      if (itemError) throw itemError;

      setCategories(categoryData);
      setItems(itemData);
    } catch (error) {
      console.error("Error fetching menu:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setCategories((prevCategories) => {
      const idx = prevCategories.findIndex((cat) => cat.id === categoryId);
      if (idx === -1) return prevCategories;
      const newCategories = [...prevCategories];
      const [selected] = newCategories.splice(idx, 1);
      return [selected, ...newCategories];
    });
    setShowMenu(false);
  };

  const categoriesWithCounts = categories.map((category) => {
    const itemCount = items.filter(
      (item) => item.category_id === category.id
    ).length;
    return { ...category, itemCount };
  });

  if (loading) {
    return (
      <div className="loading-state">
        <img src="./cafe-logo.svg" alt="HI" />
      </div>
    );
  }
  return (
    <div className="home-page">
      <div className="home-top">
        <Navbar />
        <div className="home-top-content">
          <p>What's On Your Mind To Eat?</p>
          <img src="./chef-img.svg" alt="" />
        </div>
        <div className="search-sec">
          <img src="./search-icon.svg" alt="" />
          <input type="text" placeholder='Try to search "DOSA" or anything..' />
        </div>
        <div className="home-header">
          <img src="./verified-icon.svg" alt="O" />
          <hr />
          <p>Top Categories</p>
          <hr />
          <img src="./verified-icon.svg" alt="O" />
        </div>
      </div>
      <div className="menu-section">
        {categories.map((category) => (
          <MenuCategory
            key={category.id}
            category={category}
            items={items.filter((item) => item.category_id === category.id)}
          />
        ))}
      </div>
      <div className="menu-button">
        <button onClick={() => setShowMenu(true)}>MENU</button>
      </div>
      {showMenu && (
        <div className="food-menu">
          <button className="menu-close-btn" onClick={() => setShowMenu(false)}>
            <img src="./drop-down.svg" alt="x" />
          </button>
          <header>MENU</header>
          <div className="menu-list">
            {categoriesWithCounts.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
              >
                <p>{category.name}</p>
                <p>{category.itemCount}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      <div
        className="items-indicator"
        style={{ display: getTotalItems() === 0 ? "none" : "flex" }}
      >
        <p>{getTotalItems()} items added</p>
        <Link to="/cart" className="cart-icon">
          <button>
            <p>VIEW CART</p>
            <img src="./cart-icon.svg" alt="" />
          </button>
        </Link>
      </div>
      {showSideBar && <SideBar />}
    </div>
  );
};

export default Home;

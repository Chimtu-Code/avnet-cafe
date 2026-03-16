import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../../shared/components/Navbar';
import SideBar from '../../../shared/components/SideBar';
import MenuCategory from '../components/MenuCategory';
import { useMenuData } from '../hooks/useMenuData';
import { useCartData } from '../../cart/context/CartContext';
import { useSideBar } from '../../../shared/context/SideBarContext';
import '../styles/Home.css';

// RestaurantContext handles the closed overlay globally — Home only owns the menu.

const Home = () => {
  const { showSideBar } = useSideBar();
  const {
    categories,
    setCategories,
    items,
    loading,
    categoriesWithCounts,
  } = useMenuData();

  const { totalItems } = useCartData();
  const [showMenu, setShowMenu]       = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategoryClick = (categoryId) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === categoryId);
      if (idx === -1) return prev;
      const next = [...prev];
      const [selected] = next.splice(idx, 1);
      return [selected, ...next];
    });
    setShowMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredItems = searchQuery.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const visibleCategories = searchQuery.trim()
    ? categories.filter((c) => filteredItems.some((i) => i.category_id === c.id))
    : categories;

  if (loading) {
    return (
      <div className="loading-state">
        <img src="/cafe-logo.svg" alt="Loading…" />
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-top">
        <Navbar />
        <div className="home-top-content">
          <p>What's On Your Mind To Eat?</p>
          <img src="/chef-img.svg" alt="" />
        </div>
        <div className="search-sec">
          <img src="/search-icon.svg" alt="" />
          <input
            type="text"
            placeholder='Try to search "DOSA" or anything…'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="home-header">
          <img src="/verified-icon.svg" alt="" />
          <hr />
          <p>Top Categories</p>
          <hr />
          <img src="/verified-icon.svg" alt="" />
        </div>
      </div>

      <div className="menu-section">
        {searchQuery.trim() && filteredItems.length === 0 ? (
          <p className="search-empty">No items match "{searchQuery}"</p>
        ) : (
          visibleCategories.map((category) => (
            <MenuCategory
              key={category.id}
              category={category}
              items={filteredItems.filter((i) => i.category_id === category.id)}
            />
          ))
        )}
      </div>

      <div className="menu-button">
        <button onClick={() => setShowMenu(true)}>MENU</button>
      </div>

      {showMenu && (
        <div className="food-menu">
          <button className="menu-close-btn" onClick={() => setShowMenu(false)}>
            <img src="/drop-down.svg" alt="close" />
          </button>
          <header>MENU</header>
          <div className="menu-list">
            {categoriesWithCounts.map((cat) => (
              <button key={cat.id} onClick={() => handleCategoryClick(cat.id)}>
                <p>{cat.name}</p>
                <p>{cat.itemCount}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {totalItems > 0 && (
        <div className="items-indicator">
          <p>{totalItems} items added</p>
          <Link to="/cart" className="cart-icon">
            <button>
              <p>VIEW CART</p>
              <img src="/cart-icon.svg" alt="" />
            </button>
          </Link>
        </div>
      )}

      {showSideBar && <SideBar />}
    </div>
  );
};

export default Home;
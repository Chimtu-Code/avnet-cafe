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
  const [restaurantOpen, setRestaurantOpen] = useState(true);

  useEffect(() => {
    fetchMenuData();
    checkRestaurantStatus();

    // Subscribe to real-time status updates
    const subscription = supabase
      .channel('restaurant_status')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'restaurant_settings' },
        (payload) => {
          setRestaurantOpen(payload.new.is_open);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkRestaurantStatus = async () => {
    const { data } = await supabase
      .from("restaurant_settings")
      .select("is_open")
      .eq("id", 1)
      .single();

    if (data) {
      setRestaurantOpen(data.is_open);
    }
  };

  const fetchMenuData = async () => {
    try {
      setLoading(true);

      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*");

      if (categoryError) throw categoryError;

      const { data: itemData, error: itemError } = await supabase
        .from("items")
        .select("*")
        .is("avaliable", true);

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
      <style>{`
        .closed-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(5px);
        }

        .closed-sign {
          position: relative;
          width: 300px;
          height: 200px;
          background: linear-gradient(145deg, #8B4513, #A0522D);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border: 8px solid #654321;
          animation: swing 2s ease-in-out infinite;
          transform-origin: top center;
        }

        .closed-sign::before {
          content: '';
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 40px;
          background: linear-gradient(180deg, #333, #666);
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        }

        .closed-sign::after {
          content: '';
          position: absolute;
          top: -48px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 20px;
          background: #666;
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        @keyframes swing {
          0%, 100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }

        .closed-text {
          font-family: 'Poppins', sans-serif;
          font-size: 3rem;
          font-weight: 800;
          color: #FFD700;
          text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
          margin: 0;
          letter-spacing: 2px;
        }

        .closed-subtext {
          font-family: 'Poppins', sans-serif;
          font-size: 1.2rem;
          color: #FFF;
          margin-top: 0.5rem;
          text-align: center;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        }

        .closed-message {
          margin-top: 2rem;
          font-family: 'Poppins', sans-serif;
          font-size: 1.1rem;
          color: #FFF;
          text-align: center;
          max-width: 400px;
          padding: 0 1rem;
        }

        @media (max-width: 768px) {
          .closed-sign {
            width: 250px;
            height: 170px;
          }

          .closed-text {
            font-size: 2.5rem;
          }

          .closed-subtext {
            font-size: 1rem;
          }

          .closed-message {
            font-size: 1rem;
          }
        }
      `}</style>

      {!restaurantOpen && (
        <div className="closed-overlay">
          <div className="closed-sign">
            <p className="closed-text">CLOSED</p>
            <p className="closed-subtext">Sorry, We're Closed</p>
          </div>
          <p className="closed-message">
            We're currently closed. Please check back during our operating hours. Thank you!
          </p>
        </div>
      )}

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
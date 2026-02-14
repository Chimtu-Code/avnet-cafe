import { useState, React, useEffect, useRef } from "react";
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
  const [closedMessage, setClosedMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const pollingIntervalRef = useRef(null);
  const channelRef = useRef(null);
  const statusChannelRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    fetchMenuData();
    checkRestaurantStatus();

    // Set up Supabase Broadcast Channel for menu updates
    channelRef.current = supabase
      .channel('menu-updates')
      .on('broadcast', { event: 'menu-changed' }, () => {
        console.log('Menu update broadcast received');
        fetchMenuDataSilently();
      })
      .subscribe();

    // Set up channel for restaurant status updates
    statusChannelRef.current = supabase
      .channel("restaurant-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_settings" },
        checkRestaurantStatus
      )
      .on('broadcast', { event: 'status-changed' }, () => {
        console.log('Status update broadcast received');
        checkRestaurantStatus();
      })
      .subscribe();

    // Fallback polling: Every 5 minutes (much less aggressive)
    pollingIntervalRef.current = setInterval(() => {
      fetchMenuDataSilently();
      checkRestaurantStatus();
    }, 300000); // 5 minutes = 300000ms

    // Handle page visibility - fetch when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMenuDataSilently();
        checkRestaurantStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (statusChannelRef.current) {
        supabase.removeChannel(statusChannelRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const checkRestaurantStatus = async () => {
    try {
      const { data } = await supabase
        .from("restaurant_settings")
        .select("is_open, closed_message")
        .eq("id", 1)
        .single();

      if (data) {
        setRestaurantOpen(data.is_open);
        setClosedMessage(
          data.closed_message || 
          "We're currently closed. Please check back during our operating hours. Thank you!"
        );
      }
    } catch (error) {
      console.error("Error checking restaurant status:", error);
    }
  };

  const fetchMenuData = async () => {
    try {
      setLoading(true);

      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .order('id', { ascending: true });

      if (categoryError) throw categoryError;

      const { data: itemData, error: itemError } = await supabase
        .from("items")
        .select("*")
        .is("avaliable", true)
        .order('id', { ascending: true });

      if (itemError) throw itemError;

      setCategories(categoryData || []);
      setItems(itemData || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching menu:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Silent fetch without showing loading state
  const fetchMenuDataSilently = async () => {
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .order('id', { ascending: true });

      if (categoryError) throw categoryError;

      const { data: itemData, error: itemError } = await supabase
        .from("items")
        .select("*")
        .is("avaliable", true)
        .order('id', { ascending: true });

      if (itemError) throw itemError;

      // Only update if data has actually changed
      setCategories((prev) => {
        const hasChanged = JSON.stringify(prev) !== JSON.stringify(categoryData);
        return hasChanged ? (categoryData || []) : prev;
      });

      setItems((prev) => {
        const hasChanged = JSON.stringify(prev) !== JSON.stringify(itemData);
        return hasChanged ? (itemData || []) : prev;
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error polling menu data:", error.message);
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchMenuDataSilently();
    await checkRestaurantStatus();
    setTimeout(() => setIsRefreshing(false), 500);
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

        .refresh-button {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 100;
          background: #fff;
          border: 2px solid #ff6b35;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: none; /* HIDDEN */
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }

        .refresh-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .refresh-button:active {
          transform: scale(0.95);
        }

        .refresh-button.refreshing {
          animation: spin 0.5s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .refresh-icon {
          width: 24px;
          height: 24px;
          color: #ff6b35;
        }

        .last-updated {
          position: fixed;
          top: 75px;
          right: 20px;
          z-index: 100;
          background: rgba(255, 255, 255, 0.95);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          color: #666;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          font-family: 'Poppins', sans-serif;
          display: none; /* HIDDEN */
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

          .refresh-button {
            width: 45px;
            height: 45px;
            top: 15px;
            right: 15px;
          }

          .last-updated {
            top: 65px;
            right: 15px;
            font-size: 0.7rem;
          }
        }
      `}</style>

      {/* Manual Refresh Button - HIDDEN */}
      <button 
        className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        title="Refresh menu"
      >
        <svg className="refresh-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Last Updated - HIDDEN */}
      <div className="last-updated">
        Updated {lastUpdated.toLocaleTimeString()}
      </div>

      {!restaurantOpen && (
        <div className="closed-overlay">
          <div className="closed-sign">
            <p className="closed-text">CLOSED</p>
            <p className="closed-subtext">Sorry, We're Closed</p>
          </div>
          <p className="closed-message">
            {closedMessage}
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
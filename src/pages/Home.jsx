import {useState,React,useEffect} from "react";
import Navbar from "../components/Navbar";
import "../styles/Home.css";
import MenuCategory from "../components/MenuCategory";
import { supabase } from "../services/supabaseClient";

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*');

      if (categoryError) throw categoryError;

      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('*');

      if (itemError) throw itemError;

      setCategories(categoryData);
      setItems(itemData);
    } catch (error) {
      console.error('Error fetching menu:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">
      <img src="./cafe-logo.svg" alt="HI" />
    </div>;
  }
  return (
    <div className="home-page">
      <div className="home-top">
        <Navbar />
        <div className="home-top-content">
          <p>What do you want to eat?</p>
          <img src="./chef-img.svg" alt="" />
        </div>
        <div className="search-sec">
          <img src="./search-icon.svg" alt="" />
          <input type="text" />
        </div>
        <div className="home-header">
          <img src="./coffee.svg" alt="O" />
          <hr />
          <p>Top Categories</p>
          <hr />
          <img src="./coffee.svg" alt="O" />
        </div>
      </div>
      <div className="menu-section">
        {categories.map((category)=>(
          <MenuCategory key={category.id} category={category} items={items.filter(item=>item.category_id===category.id)}/>
        ))}
      </div>
    </div>
  );
};

export default Home;

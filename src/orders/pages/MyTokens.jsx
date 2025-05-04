import { React, useState, useEffect } from "react";
import "./MyTokens.css";
import TokenCard from "../components/TokenCard";
import { supabase } from "../../services/supabaseClient";

const MyTokens = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const userPhone = localStorage.getItem("userPhone");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userPhone) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("phone", userPhone)
        .order("created_at", { ascending: false });

      if (!error) setOrders(data);
      setLoading(false);
    };

    fetchOrders();
  }, [userPhone]);

  return (
    <div className="user-tokens">
      <div className="user-tokens-nav">
        <p>My Tokens</p>
        <button>
          <img src="./menu.svg" alt="=" />
        </button>
      </div>
      <div className="user-tokens-list">
        {loading ? (
          <p>Loading...</p>
        ) : orders.length > 0 ? (
          orders.map((order) => <TokenCard key={order.id} order={order} />)
        ) : (
          <p>No orders found.</p>
        )}
      </div>
    </div>
  );
};

export default MyTokens;

import { React, useState, useEffect } from "react";
import "./MyTokens.css";
import TokenCard from "../components/TokenCard";
import { supabase } from "../../services/supabaseClient";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

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
        <button onClick={() => (window.location.href = "/")}>
          <img src="./back-arrow.svg" alt="Back" className="back-arw" />
        </button>
        <p>My Tokens</p>
      </div>
      <div className="user-tokens-list">
        {loading ? (
          <DotLottieReact src="./loader-food-animation.lottie" loop autoplay className="loader-animation"/>
        ) : orders.length > 0 ? (
          orders.map((order) => <TokenCard key={order.id} order={order} />)
        ) : (
          <>
            <img src="./no-tokens.svg" alt=":(" className="no-tokens" />
          </>
        )}
      </div>
    </div>
  );
};

export default MyTokens;

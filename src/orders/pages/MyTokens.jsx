import { React, useState, useEffect } from "react";
import "./MyTokens.css";
import TokenCard from "../components/TokenCard";
import { supabase } from "../../services/supabaseClient";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const MyTokens = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Support both old key (single string) and new key (array)
  const stored = localStorage.getItem("userPhones");
  const legacy = localStorage.getItem("userPhone");

  const userPhones = stored ? JSON.parse(stored) : legacy ? [legacy] : [];

  useEffect(() => {
    if (!userPhones.length) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("phone", userPhones)
        .order("created_at", { ascending: false });
      if (!error) setOrders(data);
      setLoading(false);
    };

    fetchOrders();

    // Listen for status changes on this user's orders only
    const channel = supabase
      .channel("my-orders-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          // Only update if it's one of this user's orders
          const isMyOrder = userPhones.includes(payload.new.phone);
          if (!isMyOrder) return;
          setOrders((prev) =>
            prev.map((o) => (o.id === payload.new.id ? payload.new : o)),
          );
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

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
          <DotLottieReact
            src="./loader-food-animation.lottie"
            loop
            autoplay
            className="loader-animation"
          />
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

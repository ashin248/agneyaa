// src/User/pages/OnlinePayment.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../shared/utils/api";
import "../style/OnlinePayment.css";

function OnlinePayment() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // or 'upi'

  // Load Razorpay Script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // 1. Load order details from navigation state
  useEffect(() => {
    if (!state?.orderId || !state?.amount) {
      setError("No order information received. Redirecting...");
      setTimeout(() => navigate("/shop"), 3000);
      return;
    }

    setOrder({
      _id: state.orderId,
      amount: Number(state.amount),
      product: state.product || {},
      customDesignUrl: state.customDesignUrl || null,
    });
  }, [state, navigate]);

  // 2. Handle Razorpay Checkout
  const handlePayment = async () => {
    if (!order?._id || !state?.razorpayOrderId) {
      setError("No valid order information found. Please try again from checkout.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login again");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 2a. Get Razorpay Key from backend
      const { data: { key } } = await API.get("/api/payment/key", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Razorpay Key Received:", key); 

      // 2b. Prepare Razorpay Options (Using the ID passed from Purchase/Order)
      const options = {
        key: key, 
        amount: state.razorpayAmount,
        currency: "INR",
        name: "Agneya Print Services",
        description: `Payment for Order ${order._id.slice(-8)}`,
        // image: "/Agneya_Creations.png", 
        order_id: state.razorpayOrderId, // Use ID from navigation state
        handler: async function (response) {
          // 2c. On Success, verify the signature on backend
          try {
            setLoading(true);
            const verifyRes = await API.post(
              `/api/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: order._id
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              setOrderConfirmed(true);
              setTimeout(() => {
                navigate("/my-orders");
              }, 2800);
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || "Payment verification failed.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#9C51B6"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        setError(`Payment Failed: ${response.error.description}`);
      });
      rzp1.open();

    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Manual UPI Payment
  const handleManualPayment = async () => {
    if (!order?._id) return;
    if (!transactionId.trim()) {
      setError("Please enter the UPI Transaction ID/UTR for verification.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await API.post(`/api/orders/confirm-payment/${order._id}`, {
        transactionId,
        paymentMethod: "UPI Manual",
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setOrderConfirmed(true);
        setTimeout(() => navigate("/my-orders"), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───
  if (!order && !error) {
    return <div className="payment-loading">Loading payment details...</div>;
  }

  if (error && !order) {
    return (
      <div className="payment-error-page">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/shop")}>Back to Shop</button>
      </div>
    );
  }

  return (
    <div className="online-payment-page">
      <div className="payment-container">
        <h1>Checkout</h1>

        {orderConfirmed ? (
          <div className="success-section">
            <div className="success-icon">✅</div>
            <h2>Payment Successful!</h2>
            <p>Thank you! Your order has been placed and payment confirmed.</p>
            <p>Order ID: <strong>{order._id?.slice(-8)}</strong></p>
            <p>Redirecting to My Orders in a few seconds...</p>
          </div>
        ) : (
          <>
            {/* Order Summary */}
            <div className="order-summary">
              {(order.product?.imageUrl || order.customDesignUrl) && (
                <img
                  src={order.customDesignUrl || order.product?.imageUrl}
                  alt={order.product?.name || "Custom Product"}
                  className="product-preview"
                  onError={(e) => (e.target.src = "/placeholder-product.jpg")}
                />
              )}
              <div className="summary-details">
                <h3>{order.product?.name || "Custom Product"}</h3>
                <p className="amount">
                  Total Amount: <strong>₹{order.amount?.toFixed(2)}</strong>
                </p>
                <p className="order-id">Order Reference #{order._id?.slice(-8)}</p>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="payment-options">
               <div className="tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button 
                    className={paymentMethod === 'razorpay' ? 'active' : ''} 
                    onClick={() => setPaymentMethod('razorpay')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'razorpay' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)' }}
                  >
                    Online (Razorpay)
                  </button>
                  <button 
                    className={paymentMethod === 'upi' ? 'active' : ''} 
                    onClick={() => setPaymentMethod('upi')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'upi' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)' }}
                  >
                    Manual UPI
                  </button>
               </div>

               {paymentMethod === 'razorpay' ? (
                 <div className="upi-section">
                    <h3 style={{ marginBottom: '1rem' }}>Secure Checkout via Razorpay</h3>
                    <p style={{ color: "var(--text-dim)", marginBottom: '2rem' }}>
                      Pay securely using Credit/Debit Cards, NetBanking, UPI, or Wallets.
                    </p>
                    <button
                      className="btn-confirm"
                      onClick={handlePayment}
                      disabled={loading || !order?._id}
                    >
                      {loading ? "Processing..." : "Pay Now with Razorpay"}
                    </button>
                 </div>
               ) : (
                 <div className="manual-upi-section" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ marginBottom: '15px' }}>Direct UPI Payment</h3>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>
                      Please pay the exact amount to the following UPI ID and enter the Transaction ID below.
                    </p>
                    
                    <div className="upi-id-box" style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '10px', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '1px', color: 'var(--color-primary)', marginBottom: '20px' }}>
                      919656353903@waaxis
                    </div>

                    <div className="qr-code-placeholder" style={{ marginBottom: '20px' }}>
                       <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=919656353903@waaxis%26pn=Agneya%20Print%20Services%26am=${order.amount}%26cu=INR`} 
                          alt="UPI QR Code" 
                          style={{ borderRadius: '10px', border: '5px solid white' }}
                       />
                       <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px' }}>Scan with any UPI App (GPay, PhonePe, etc.)</p>
                    </div>

                    <input 
                       type="text"
                       placeholder="Enter 12-digit UTR / Transaction ID *"
                       value={transactionId}
                       onChange={(e) => setTransactionId(e.target.value)}
                       style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', marginBottom: '20px' }}
                    />

                    <button
                      className="btn-confirm"
                      onClick={handleManualPayment}
                      disabled={loading || !transactionId || !order?._id}
                    >
                      {loading ? "Submitting..." : "Confirm Payment"}
                    </button>
                 </div>
               )}

               {error && <p className="error-message" style={{ marginTop: '1rem', color: '#ff4d4d' }}>{error}</p>}
            </div>
          </>
        )}

        <button
          className="btn-back"
          onClick={() => navigate(-1)}
          style={{ marginTop: "2rem" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default OnlinePayment;
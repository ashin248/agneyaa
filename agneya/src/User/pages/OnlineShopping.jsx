

// src/user/pages/OnlineShopping.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { staggeredGravityContainer, gravityScrollVariant } from "../../shared/animations/framerVariants";
import { Helmet } from "react-helmet-async";
import ProductReviews from "../components/ProductReviews";
import API from "../../shared/utils/api";
import "../style/OnlineShopping.css";

function OnlineShopping() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("buy");
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [companyProducts, setCompanyProducts] = useState([]);
  const [customizableBases, setCustomizableBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  const categoryIcons = {
    "All": "bi-grid-fill",
    "T-Shirt": "bi-person-vcard",
    "Business Card": "bi-card-heading",
    "Brochure": "bi-book-half",
    "Label": "bi-tags",
    "Keychain": "bi-key",
    "Photo Printing": "bi-image",
    "Banner": "bi-flag",
    "Card": "bi-postcard",
    "Sticker": "bi-stickies"
  };

  // Fallback dummy data – shown when API returns empty arrays or fails
  const dummyReadyProducts = [
    {
      _id: "demo-ready-1",
      name: "Premium Cotton Round Neck T-Shirt",
      price: 499,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
      category: "T-Shirt",
      createdAt: new Date().toISOString()
    },
    {
      _id: "demo-ready-2",
      name: "Matte Finish Business Card (100 pcs)",
      price: 349,
      imageUrl: "https://images.unsplash.com/photo-1587847264519-4a9a8b8d3d7f?w=600",
      category: "Business Card",
      createdAt: new Date().toISOString()
    },
    {
      _id: "demo-ready-3",
      name: "Vinyl Sticker Pack (10 Designs)",
      price: 249,
      imageUrl: "https://images.unsplash.com/photo-1581287053822-fd7bf4f1b16f?w=600",
      category: "Sticker",
      createdAt: new Date().toISOString()
    },
    {
      _id: "demo-ready-4",
      name: "A4 Brochure Printing (Glossy)",
      price: 12.5,
      imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600",
      category: "Brochure",
      createdAt: new Date().toISOString()
    }
  ];

  const dummyCustomBases = [
    {
      _id: "demo-custom-1",
      name: "Classic Round Neck T-Shirt (Custom Print Ready)",
      basePrice: 399,
      imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600",
      category: "T-Shirt",
      createdAt: new Date().toISOString()
    },
    {
      _id: "demo-custom-2",
      name: "Heavy Cotton Oversized Hoodie Base",
      basePrice: 949,
      imageUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600",
      category: "T-Shirt",
      createdAt: new Date().toISOString()
    },
    {
      _id: "demo-custom-3",
      name: "White Ceramic Mug (Sublimation Ready)",
      basePrice: 349,
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
      category: "Photo Printing",
      createdAt: new Date().toISOString()
    },
    {
      _id: "demo-custom-4",
      name: "PVC Keychain Base (Double Side Print)",
      basePrice: 79,
      imageUrl: "https://images.unsplash.com/photo-1605640840604-14ac1f9b8a24?w=600",
      category: "Keychain",
      createdAt: new Date().toISOString()
    }
  ];

  // Fetch real data from backend
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const [readyRes, customRes] = await Promise.all([
          API.get("/api/products/ready"),
          API.get("/api/products/custom-bases")
        ]);

        let readyData = readyRes?.data?.products || readyRes?.data?.data || [];
        let customData = customRes?.data?.customBases || customRes?.data?.data || [];

        // Use fallback data when API returns empty
        if (readyData.length === 0) {
          console.log("[Fallback] No ready products from API → using dummy data");
          readyData = dummyReadyProducts;
        }

        if (customData.length === 0) {
          console.log("[Fallback] No custom bases from API → using dummy data");
          customData = dummyCustomBases;
        }

        setCompanyProducts(readyData);
        setCustomizableBases(customData);
      } catch (err) {
        console.error("Products fetch error:", err);
        setError("Couldn't load products from server. Showing sample items.");
        // On network/server error → show dummies
        setCompanyProducts(dummyReadyProducts);
        setCustomizableBases(dummyCustomBases);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const allProducts = [...companyProducts, ...customizableBases];
    const cats = new Set(allProducts.map(p => p.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [companyProducts, customizableBases]);

  // Filtered & Sorted Ready Products
  const filteredReadyProducts = useMemo(() => {
    let list = [...companyProducts];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== "All") {
      list = list.filter(p => p.category === selectedCategory);
    }

    const min = priceRange.min ? Number(priceRange.min) : -Infinity;
    const max = priceRange.max ? Number(priceRange.max) : Infinity;
    if (min !== -Infinity || max !== Infinity) {
      list = list.filter(p => {
        const price = p.price || 0;
        return price >= min && price <= max;
      });
    }

    if (sortBy === "price-low-high") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high-low") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [companyProducts, searchTerm, selectedCategory, priceRange, sortBy]);

  // Filtered & Sorted Custom Bases
  const filteredCustomBases = useMemo(() => {
    let list = [...customizableBases];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== "All") {
      list = list.filter(p => p.category === selectedCategory);
    }

    const min = priceRange.min ? Number(priceRange.min) : -Infinity;
    const max = priceRange.max ? Number(priceRange.max) : Infinity;
    if (min !== -Infinity || max !== Infinity) {
      list = list.filter(p => {
        const price = p.basePrice || 0;
        return price >= min && price <= max;
      });
    }

    if (sortBy === "price-low-high") {
      list.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
    } else if (sortBy === "price-high-low") {
      list.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [customizableBases, searchTerm, selectedCategory, priceRange, sortBy]);

  const handleProtectedAction = (path, stateData = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.setItem("redirectAfterLogin", JSON.stringify({ path, state: stateData }));
      setShowAuthModal(true);
    } else {
      navigate(path, { state: stateData });
    }
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="online-shopping-page">
      <Helmet>
        <title>Shop Custom Products | Agneya Kochi</title>
        <meta name="description" content="Browse and customize products at Agneya Kochi. Custom T-shirts, printing services, and more." />
      </Helmet>

      <motion.h1
        className="drop-anim"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      >
        Shop
      </motion.h1>

      {/* Category Icons Navigation */}
      <motion.div
        className="category-icons-nav"
        variants={staggeredGravityContainer}
        initial="hidden"
        animate="visible"
      >
        {categories.map((cat) => (
          <motion.div
            key={cat}
            className={`category-icon-item ${selectedCategory === cat ? "active" : ""}`}
            variants={gravityScrollVariant}
            whileHover={{ y: -10, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(cat)}
          >
            <div className="icon-wrapper">
              <i className={`bi ${categoryIcons[cat] || "bi-box-seam"}`}></i>
            </div>
            <span>{cat}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        className="filters-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <input
          type="text"
          placeholder="Search by name or category..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="filter-group">
          <label>Category:</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-group price-range">
          <label>Price Range:</label>
          <input
            type="number"
            placeholder="Min ₹"
            value={priceRange.min}
            onChange={e => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
          />
          <span>–</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={priceRange.max}
            onChange={e => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
          />
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
          </select>
        </div>

        <button
          className="clear-filters"
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("All");
            setPriceRange({ min: "", max: "" });
            setSortBy("newest");
          }}
        >
          Clear Filters
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "buy" ? "active" : ""}
          onClick={() => setActiveTab("buy")}
        >
          Ready Products
        </button>
        <button
          className={activeTab === "custom" ? "active" : ""}
          onClick={() => setActiveTab("custom")}
        >
          Custom Products
        </button>
      </div>

      {/* Ready Products Grid */}
      {activeTab === "buy" && (
        <motion.div
          className="product-grid"
          variants={staggeredGravityContainer}
          initial="hidden"
          animate="visible"
        >
          {filteredReadyProducts.length === 0 ? (
            <p className="no-results">No products match your filters 😕</p>
          ) : (
            filteredReadyProducts.map(p => (
              <motion.div key={p._id} className="product-card" variants={gravityScrollVariant}>
                <div className="product-img-wrapper">
                  <img
                    className="product-img"
                    src={p.imageUrl}
                    alt={p.name}
                    onError={e => e.target.src = "/placeholder-product.jpg"}
                  />
                </div>
                <div className="product-info">
                  <h3 className="product-title">{p.name}</h3>
                  <p className="product-price">₹{(p.price || 0).toLocaleString("en-IN")}</p>
                  {p.category && <span className="category-tag">{p.category}</span>}
                  <button
                    className="add-to-cart-btn"
                    onClick={() => handleProtectedAction("/purchase", { product: p })}
                  >
                    Buy Now
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* Custom Bases Grid */}
      {activeTab === "custom" && (
        <motion.div
          className="product-grid"
          variants={staggeredGravityContainer}
          initial="hidden"
          animate="visible"
        >
          {filteredCustomBases.length === 0 ? (
            <p className="no-results">No custom bases found</p>
          ) : (
            filteredCustomBases.map(p => (
              <motion.div key={p._id} className="product-card" variants={gravityScrollVariant}>
                <div className="product-img-wrapper">
                  <img
                    className="product-img"
                    src={p.imageUrl}
                    alt={p.name}
                    onError={e => e.target.src = "/placeholder-product.jpg"}
                  />
                </div>
                <div className="product-info">
                  <h3 className="product-title">{p.name}</h3>
                  <p className="product-price">From ₹{(p.basePrice || 0).toLocaleString("en-IN")}</p>
                  {p.category && <span className="category-tag">{p.category}</span>}
                  <button
                    className="add-to-cart-btn"
                    onClick={() => handleProtectedAction("/customize", { baseProduct: p })}
                  >
                    Customize
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* Login Required Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay">
          <motion.div
            className="auth-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <h2>Login Required</h2>
            <p>You need to login to use the Buy Now or Customize features.</p>
            <div className="modal-actions">
              <button
                className="primary-btn"
                onClick={() => {
                  setShowAuthModal(false);
                  navigate("/login");
                }}
              >
                Login
              </button>
              <button onClick={() => setShowAuthModal(false)}>Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reviews Section */}
      <ProductReviews productId="general-shop" />
    </div>
  );
}

export default OnlineShopping;










// // src/user/pages/OnlineShopping.jsx
// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom"; // ← useLocation added
// import { motion } from "framer-motion";
// import { staggeredGravityContainer, gravityScrollVariant } from "../../shared/animations/framerVariants";
// import { Helmet } from "react-helmet-async";
// import ProductReviews from "../components/ProductReviews";
// import API from "../../shared/utils/api";
// import "../style/OnlineShopping.css";

// function OnlineShopping() {
//   const navigate = useNavigate();
//   const location = useLocation(); // ← to get from state if needed

//   const [activeTab, setActiveTab] = useState("buy");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [priceRange, setPriceRange] = useState({ min: "", max: "" });
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [sortBy, setSortBy] = useState("newest");

//   const [companyProducts, setCompanyProducts] = useState([]);
//   const [customizableBases, setCustomizableBases] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [showAuthModal, setShowAuthModal] = useState(false);
  
//   const categoryIcons = {
//     "All": "bi-grid-fill",
//     "T-Shirt": "bi-person-vcard",
//     "Business Card": "bi-card-heading",
//     "Brochure": "bi-book-half",
//     "Label": "bi-tags",
//     "Keychain": "bi-key",
//     "Photo Printing": "bi-image",
//     "Banner": "bi-flag",
//     "Card": "bi-postcard",
//     "Sticker": "bi-stickies"
//   };

//   // Fetch products from separate endpoints
//   useEffect(() => {
//     const fetchProducts = async () => {
//       setLoading(true);
//       setError("");

//       try {
//         // Ready products
//         const readyRes = await API.get("/api/products/ready");
//         if (readyRes.data.success) {
//           setCompanyProducts(readyRes.data.products || []);
//         }

//         // Custom bases
//         const customRes = await API.get("/api/products/custom-bases");
//         if (customRes.data.success) {
//           setCustomizableBases(customRes.data.customBases || []);
//         }
//       } catch (err) {
//         setError(err.response?.data?.message || "Failed to load products. Please try again.");
//         console.error("Fetch error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProducts();
//   }, []);

//   // Extract unique categories
//   const categories = useMemo(() => {
//     const allProducts = [...companyProducts, ...customizableBases];
//     const cats = new Set(allProducts.map(p => p.category).filter(Boolean));
//     return ["All", ...Array.from(cats)];
//   }, [companyProducts, customizableBases]);

//   // Filtered & Sorted Ready Products
//   const filteredReadyProducts = useMemo(() => {
//     let list = [...companyProducts];
//     if (searchTerm.trim()) {
//       const term = searchTerm.toLowerCase();
//       list = list.filter(p =>
//         p.name?.toLowerCase().includes(term) || p.category?.toLowerCase().includes(term)
//       );
//     }
//     if (selectedCategory !== "All") {
//       list = list.filter(p => p.category === selectedCategory);
//     }
//     const min = priceRange.min ? Number(priceRange.min) : -Infinity;
//     const max = priceRange.max ? Number(priceRange.max) : Infinity;
//     if (min !== -Infinity || max !== Infinity) {
//       list = list.filter(p => {
//         const price = p.price || 0;
//         return price >= min && price <= max;
//       });
//     }
//     if (sortBy === "price-low-high") {
//       list.sort((a, b) => a.price - b.price);
//     } else if (sortBy === "price-high-low") {
//       list.sort((a, b) => b.price - a.price);
//     } else if (sortBy === "newest") {
//       list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
//     }
//     return list;
//   }, [companyProducts, searchTerm, selectedCategory, priceRange, sortBy]);

//   // Filtered & Sorted Custom Bases
//   const filteredCustomBases = useMemo(() => {
//     let list = [...customizableBases];
//     if (searchTerm.trim()) {
//       const term = searchTerm.toLowerCase();
//       list = list.filter(p =>
//         p.name?.toLowerCase().includes(term) || p.category?.toLowerCase().includes(term)
//       );
//     }
//     if (selectedCategory !== "All") {
//       list = list.filter(p => p.category === selectedCategory);
//     }
//     const min = priceRange.min ? Number(priceRange.min) : -Infinity;
//     const max = priceRange.max ? Number(priceRange.max) : Infinity;
//     if (min !== -Infinity || max !== Infinity) {
//       list = list.filter(p => {
//         const price = p.basePrice || 0;
//         return price >= min && price <= max;
//       });
//     }
//     if (sortBy === "price-low-high") {
//       list.sort((a, b) => a.basePrice - b.basePrice);
//     } else if (sortBy === "price-high-low") {
//       list.sort((a, b) => b.basePrice - a.basePrice);
//     } else if (sortBy === "newest") {
//       list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
//     }
//     return list;
//   }, [customizableBases, searchTerm, selectedCategory, priceRange, sortBy]);

//   // Protected navigation with login check + redirect after login
//   const handleProtectedAction = (path, stateData = {}) => {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       // Store intended path & state for redirect after login
//       localStorage.setItem("redirectAfterLogin", JSON.stringify({ path, state: stateData }));
//       setShowAuthModal(true);
//     } else {
//       // Logged in → direct navigation
//       navigate(path, { state: stateData });
//     }
//   };

//   if (loading) return <div className="loading">Loading products...</div>;
//   if (error) return <div className="error">{error}</div>;

//   return (
//     <div className="online-shopping-page">
//       <Helmet>
//         <title>Shop Custom Products | Agneya Kochi</title>
//         <meta name="description" content="Browse and customize products at Agneya Kochi. Custom T-shirts, printing services, and more." />
//       </Helmet>
//       <motion.h1 
//         className="drop-anim"
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
//       >
//         Shop
//       </motion.h1>

//       {/* Category Icon Navigation */}
//       <motion.div 
//         className="category-icons-nav"
//         variants={staggeredGravityContainer}
//         initial="hidden"
//         animate="visible"
//       >
//         {categories.map((cat) => (
//           <motion.div
//             key={cat}
//             className={`category-icon-item ${selectedCategory === cat ? "active" : ""}`}
//             variants={gravityScrollVariant}
//             whileHover={{ y: -10, scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={() => setSelectedCategory(cat)}
//           >
//             <div className="icon-wrapper">
//               <i className={`bi ${categoryIcons[cat] || "bi-box-seam"}`}></i>
//             </div>
//             <span>{cat}</span>
//           </motion.div>
//         ))}
//       </motion.div>

//       {/* Filters & Controls */}
//       <motion.div 
//         className="filters-container"
//         initial={{ opacity: 0, scale: 0.95 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ duration: 0.5, delay: 0.1 }}
//       >
//         <input
//           type="text"
//           placeholder="Search by name or category..."
//           value={searchTerm}
//           onChange={e => setSearchTerm(e.target.value)}
//           className="search-input"
//         />

//         <div className="filter-group">
//           <label>Category:</label>
//           <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
//             {categories.map(cat => (
//               <option key={cat} value={cat}>{cat}</option>
//             ))}
//           </select>
//         </div>

//         <div className="filter-group price-range">
//           <label>Price Range:</label>
//           <input
//             type="number"
//             placeholder="Min ₹"
//             value={priceRange.min}
//             onChange={e => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
//           />
//           <span>–</span>
//           <input
//             type="number"
//             placeholder="Max ₹"
//             value={priceRange.max}
//             onChange={e => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
//           />
//         </div>

//         <div className="filter-group">
//           <label>Sort By:</label>
//           <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
//             <option value="newest">Newest First</option>
//             <option value="price-low-high">Price: Low to High</option>
//             <option value="price-high-low">Price: High to Low</option>
//           </select>
//         </div>

//         <button
//           className="clear-filters"
//           onClick={() => {
//             setSearchTerm("");
//             setSelectedCategory("All");
//             setPriceRange({ min: "", max: "" });
//             setSortBy("newest");
//           }}
//         >
//           Clear Filters
//         </button>
//       </motion.div>

//       {/* Tabs */}
//       <div className="tabs">
//         <button
//           className={activeTab === "buy" ? "active" : ""}
//           onClick={() => setActiveTab("buy")}
//         >
//           Ready Products
//         </button>
//         <button
//           className={activeTab === "custom" ? "active" : ""}
//           onClick={() => setActiveTab("custom")}
//         >
//           Custom Products
//         </button>
//       </div>

//       {/* Ready Products Grid */}
//       {activeTab === "buy" && (
//         <motion.div 
//           className="product-grid"
//           variants={staggeredGravityContainer}
//           initial="hidden"
//           animate="visible"
//         >
//           {filteredReadyProducts.length === 0 ? (
//             <p className="no-results">No products match your filters 😕</p>
//           ) : (
//             filteredReadyProducts.map(p => (
//               <motion.div key={p._id} className="product-card" variants={gravityScrollVariant}>
//                 <div className="product-img-wrapper">
//                   <img className="product-img" src={p.imageUrl} alt={p.name} onError={e => e.target.src = "/placeholder-product.jpg"} />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-title">{p.name}</h3>
//                   <p className="product-price">₹{p.price?.toLocaleString("en-IN") || "N/A"}</p>
//                   {p.category && <span className="category-tag">{p.category}</span>}
//                   <button
//                     className="add-to-cart-btn"
//                     onClick={() => handleProtectedAction("/purchase", { product: p })}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </motion.div>
//             ))
//           )}
//         </motion.div>
//       )}

//       {/* Custom Bases Grid */}
//       {activeTab === "custom" && (
//         <motion.div 
//           className="product-grid"
//           variants={staggeredGravityContainer}
//           initial="hidden"
//           animate="visible"
//         >
//           {filteredCustomBases.length === 0 ? (
//             <p className="no-results">No custom bases found</p>
//           ) : (
//             filteredCustomBases.map(p => (
//               <motion.div key={p._id} className="product-card" variants={gravityScrollVariant}>
//                 <div className="product-img-wrapper">
//                   <img className="product-img" src={p.imageUrl} alt={p.name} onError={e => e.target.src = "/placeholder-product.jpg"} />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-title">{p.name}</h3>
//                   <p className="product-price">From ₹{(p.basePrice)?.toLocaleString("en-IN") || "N/A"}</p>
//                   {p.category && <span className="category-tag">{p.category}</span>}
//                   <button
//                     className="add-to-cart-btn"
//                     onClick={() => handleProtectedAction("/customize", { baseProduct: p })}
//                   >
//                     Customize
//                   </button>
//                 </div>
//               </motion.div>
//             ))
//           )}
//         </motion.div>
//       )}

//       {/* Auth Required Modal */}
//       {showAuthModal && (
//         <div className="auth-modal-overlay">
//            <motion.div 
//               className="auth-modal"
//               initial={{ scale: 0.8, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.8, opacity: 0 }}
//            >
//             <h2>Login Required</h2>
//             <p>You need to login to use the Buy Now or Customize features.</p>
//             <div className="modal-actions">
//               <button
//                 className="primary-btn"
//                 onClick={() => {
//                   setShowAuthModal(false);
//                   navigate("/login");
//                 }}
//               >
//                 Login
//               </button>
//               <button onClick={() => setShowAuthModal(false)}>Cancel</button>
//             </div>
//            </motion.div>
//         </div>
//       )}

//       {/* Reviews Section */}
//       <ProductReviews productId="general-shop" />
//     </div>
//   );
// }

// export default OnlineShopping;




// // // src/user/pages/OnlineShopping.jsx
// // import React, { useState, useEffect, useMemo } from "react";
// // import { useNavigate } from "react-router-dom";
// // import API from "../../shared/utils/api";  
// // import "../style/OnlineShopping.css";

// // function OnlineShopping() {
// //   const navigate = useNavigate();

// //   const [activeTab, setActiveTab] = useState("buy"); // "buy" or "custom"
// //   const [searchTerm, setSearchTerm] = useState("");

// //   // Filter & Sort states
// //   const [priceRange, setPriceRange] = useState({ min: "", max: "" });
// //   const [selectedCategory, setSelectedCategory] = useState("All");
// //   const [sortBy, setSortBy] = useState("newest"); // newest, price-low-high, price-high-low

// //   const [companyProducts, setCompanyProducts] = useState([]);       // ready-made
// //   const [customizableBases, setCustomizableBases] = useState([]);   // custom bases
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState("");

// //   const [showAuthModal, setShowAuthModal] = useState(false);


// // useEffect(() => {
// //   const fetchProducts = async () => {
// //     setLoading(true);
// //     setError("");

// //     try {
// //       // Ready products
// //       const readyRes = await API.get("/api/products/ready");
// //       if (readyRes.data.success) {
// //         setCompanyProducts(readyRes.data.products || []);
// //       }

// //       // Custom bases
// //       const customRes = await API.get("/api/products/custom-bases");
// //       if (customRes.data.success) {
// //         setCustomizableBases(customRes.data.customBases || []);
// //       }
// //     } catch (err) {
// //       setError(err.response?.data?.message || "Failed to load products. Please try again.");
// //       console.error("Fetch error:", err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   fetchProducts();
// // }, []);



// //   // // Fetch products using API instance
// //   // useEffect(() => {
// //   //   const fetchProducts = async () => {
// //   //     setLoading(true);
// //   //     setError("");

// //   //     try {
// //   //       const res = await API.get("/api/products");

// //   //       if (res.data.success) {
// //   //         const all = res.data.products || [];
// //   //         setCompanyProducts(all.filter(p => p.type === "ready"));
// //   //         setCustomizableBases(all.filter(p => p.type === "custom-base"));
// //   //       } else {
// //   //         setError("Failed to load products – invalid response");
// //   //       }
// //   //     } catch (err) {
// //   //       setError(err.response?.data?.message || "Failed to load products. Please try again.");
// //   //       console.error("Products fetch error:", err);
// //   //     } finally {
// //   //       setLoading(false);
// //   //     }
// //   //   };

// //   //   fetchProducts();
// //   // }, []);

// //   // Extract unique categories
// //   const categories = useMemo(() => {
// //     const allProducts = [...companyProducts, ...customizableBases];
// //     const cats = new Set(allProducts.map(p => p.category).filter(Boolean));
// //     return ["All", ...Array.from(cats)];
// //   }, [companyProducts, customizableBases]);

// //   // Filtered & Sorted Ready Products
// //   const filteredReadyProducts = useMemo(() => {
// //     let list = [...companyProducts];

// //     // Search filter
// //     if (searchTerm.trim()) {
// //       const term = searchTerm.toLowerCase();
// //       list = list.filter(p =>
// //         p.name?.toLowerCase().includes(term) ||
// //         p.category?.toLowerCase().includes(term)
// //       );
// //     }

// //     // Category filter
// //     if (selectedCategory !== "All") {
// //       list = list.filter(p => p.category === selectedCategory);
// //     }

// //     // Price range filter
// //     const min = priceRange.min ? Number(priceRange.min) : -Infinity;
// //     const max = priceRange.max ? Number(priceRange.max) : Infinity;
// //     if (min !== -Infinity || max !== Infinity) {
// //       list = list.filter(p => {
// //         const price = p.price || p.basePrice || 0;
// //         return price >= min && price <= max;
// //       });
// //     }

// //     // Sorting
// //     if (sortBy === "price-low-high") {
// //       list.sort((a, b) => (a.price || a.basePrice || 0) - (b.price || b.basePrice || 0));
// //     } else if (sortBy === "price-high-low") {
// //       list.sort((a, b) => (b.price || b.basePrice || 0) - (a.price || a.basePrice || 0));
// //     } else if (sortBy === "newest") {
// //       list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
// //     }

// //     return list;
// //   }, [companyProducts, searchTerm, selectedCategory, priceRange, sortBy]);

// //   // Filtered & Sorted Custom Bases
// //   const filteredCustomBases = useMemo(() => {
// //     let list = [...customizableBases];

// //     if (searchTerm.trim()) {
// //       const term = searchTerm.toLowerCase();
// //       list = list.filter(p =>
// //         p.name?.toLowerCase().includes(term) ||
// //         p.category?.toLowerCase().includes(term)
// //       );
// //     }

// //     if (selectedCategory !== "All") {
// //       list = list.filter(p => p.category === selectedCategory);
// //     }

// //     const min = priceRange.min ? Number(priceRange.min) : -Infinity;
// //     const max = priceRange.max ? Number(priceRange.max) : Infinity;
// //     if (min !== -Infinity || max !== Infinity) {
// //       list = list.filter(p => {
// //         const price = p.basePrice || p.price || 0;
// //         return price >= min && price <= max;
// //       });
// //     }

// //     if (sortBy === "price-low-high") {
// //       list.sort((a, b) => (a.basePrice || a.price || 0) - (b.basePrice || b.price || 0));
// //     } else if (sortBy === "price-high-low") {
// //       list.sort((a, b) => (b.basePrice || b.price || 0) - (a.basePrice || b.price || 0));
// //     } else if (sortBy === "newest") {
// //       list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
// //     }

// //     return list;
// //   }, [customizableBases, searchTerm, selectedCategory, priceRange, sortBy]);

// //   const handleProtectedAction = (action) => {
// //     const token = localStorage.getItem("token");
// //     if (!token) {
// //       setShowAuthModal(true);
// //     } else {
// //       action();
// //     }
// //   };

// //   if (loading) return <div className="loading">Loading products...</div>;
// //   if (error) return <div className="error">{error}</div>;

// //   return (
// //     <div className="online-shopping-page">
// //       <h1>Shop</h1>

// //       {/* Filters & Controls */}
// //       <div className="filters-container">
// //         <input
// //           type="text"
// //           placeholder="Search by name or category..."
// //           value={searchTerm}
// //           onChange={e => setSearchTerm(e.target.value)}
// //           className="search-input"
// //         />

// //         <div className="filter-group">
// //           <label>Category:</label>
// //           <select
// //             value={selectedCategory}
// //             onChange={e => setSelectedCategory(e.target.value)}
// //           >
// //             {categories.map(cat => (
// //               <option key={cat} value={cat}>{cat}</option>
// //             ))}
// //           </select>
// //         </div>

// //         <div className="filter-group price-range">
// //           <label>Price Range:</label>
// //           <input
// //             type="number"
// //             placeholder="Min ₹"
// //             value={priceRange.min}
// //             onChange={e => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
// //           />
// //           <span>–</span>
// //           <input
// //             type="number"
// //             placeholder="Max ₹"
// //             value={priceRange.max}
// //             onChange={e => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
// //           />
// //         </div>

// //         <div className="filter-group">
// //           <label>Sort By:</label>
// //           <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
// //             <option value="newest">Newest First</option>
// //             <option value="price-low-high">Price: Low to High</option>
// //             <option value="price-high-low">Price: High to Low</option>
// //           </select>
// //         </div>

// //         <button
// //           className="clear-filters"
// //           onClick={() => {
// //             setSearchTerm("");
// //             setSelectedCategory("All");
// //             setPriceRange({ min: "", max: "" });
// //             setSortBy("newest");
// //           }}
// //         >
// //           Clear Filters
// //         </button>
// //       </div>

// //       {/* Tabs */}
// //       <div className="tabs">
// //         <button
// //           className={activeTab === "buy" ? "active" : ""}
// //           onClick={() => setActiveTab("buy")}
// //         >
// //           Ready Products
// //         </button>
// //         <button
// //           className={activeTab === "custom" ? "active" : ""}
// //           onClick={() => setActiveTab("custom")}
// //         >
// //           Custom Products
// //         </button>
// //       </div>

// //       {/* Ready Products Grid */}
// //       {activeTab === "buy" && (
// //         <div className="product-grid">
// //           {filteredReadyProducts.length === 0 ? (
// //             <p className="no-results">No products match your filters 😕</p>
// //           ) : (
// //             filteredReadyProducts.map(p => (
// //               <div key={p._id} className="product-card">
// //                 <img src={p.imageUrl} alt={p.name} onError={e => e.target.src = "/placeholder-product.jpg"} />
// //                 <h3>{p.name}</h3>
// //                 <p className="price">₹{p.price?.toLocaleString("en-IN") || "N/A"}</p>
// //                 {p.category && <span className="category-tag">{p.category}</span>}
// //                 <button
// //                   onClick={() =>
// //                     handleProtectedAction(() =>
// //                       navigate("/purchase", { state: { product: p } })
// //                     )
// //                   }
// //                 >
// //                   Buy Now
// //                 </button>
// //               </div>
// //             ))
// //           )}
// //         </div>
// //       )}

// //       {/* Custom Bases Grid */}
// //       {activeTab === "custom" && (
// //         <div className="product-grid">
// //           {filteredCustomBases.length === 0 ? (
// //             <p className="no-results">No custom bases found</p>
// //           ) : (
// //             filteredCustomBases.map(p => (
// //               <div key={p._id} className="product-card">
// //                 <img src={p.imageUrl} alt={p.name} onError={e => e.target.src = "/placeholder-product.jpg"} />
// //                 <h3>{p.name}</h3>
// //                 <p className="price">From ₹{(p.basePrice || p.price)?.toLocaleString("en-IN") || "N/A"}</p>
// //                 {p.category && <span className="category-tag">{p.category}</span>}
// //                 <button
// //                   onClick={() =>
// //                     handleProtectedAction(() =>
// //                       navigate("/customize", { state: { baseProduct: p } })
// //                     )
// //                   }
// //                 >
// //                   Customize
// //                 </button>
// //               </div>
// //             ))
// //           )}
// //         </div>
// //       )}

// //       {/* Auth Required Modal */}
// //       {showAuthModal && (
// //         <div className="auth-modal-overlay">
// //           <div className="auth-modal">
// //             <h2>Login Required</h2>
// //             <p>Please login to continue shopping.</p>
// //             <div className="modal-actions">
// //               <button onClick={() => navigate("/login")}>Login</button>
// //               <button onClick={() => setShowAuthModal(false)}>Cancel</button>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default OnlineShopping;
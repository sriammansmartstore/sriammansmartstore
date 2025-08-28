import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, onSnapshot, doc, getDoc, getDocs } from "firebase/firestore";

/**
 * @description Custom hook to fetch all data required for the checkout page.
 * @param {Function} setInitiallySelectedAddress - A function to set the default selected address once addresses are loaded.
 * @returns {object} An object containing userProfile, addresses, cartItems, loading state, and error state.
 */
export const useCheckoutData = (setInitiallySelectedAddress) => {
  const { user } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to fetch cart data
  const fetchCartData = useCallback(async () => {
    if (!user) return [];
    
    try {
      const cartColRef = collection(db, "users", user.uid, "cart");
      const cartSnap = await getDocs(cartColRef);
      const items = cartSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      console.log('Fetched cart items:', items);
      return items;
    } catch (err) {
      console.error("Error fetching cart data:", err);
      setError("Failed to load your cart. Please try again later.");
      return [];
    }
  }, [user]);

  // Function to refresh all data
  const refreshData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Refresh user profile
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserProfile(userDocSnap.data());
      }
      
      // Refresh cart items
      const updatedCartItems = await fetchCartData();
      setCartItems(updatedCartItems);
      
      // Addresses are handled by the real-time listener
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError("Failed to refresh data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, fetchCartData]);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setAddresses([]);
      setCartItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        // Fetch user profile
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());
        }

        // Fetch cart items
        const updatedCartItems = await fetchCartData();
        setCartItems(updatedCartItems);
      } catch (err) {
        console.error("Error fetching checkout data:", err);
        setError("Failed to load your checkout details. Please try again later.");
      } finally {
        // Loading is set to false after addresses listener is set up
      }
    };

    fetchData();

      // Set up real-time listener for addresses
    const addressesColRef = collection(db, "users", user.uid, "addresses");
    const unsubscribeAddresses = onSnapshot(
      addressesColRef,
      (snapshot) => {
        const addrList = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setAddresses(addrList);

        // Set the default selected address if not already set
        if (addrList.length > 0) {
          setInitiallySelectedAddress((prevId) => prevId || addrList[0].id);
        }
        setLoading(false); // Data loading complete
      },
      (err) => {
        console.error("Error listening to addresses:", err);
        setError("Failed to load delivery addresses.");
        setLoading(false);
      }
    );

    // Set up real-time listener for cart changes
    const cartColRef = collection(db, "users", user.uid, "cart");
    const unsubscribeCart = onSnapshot(
      cartColRef,
      (snapshot) => {
        const updatedCartItems = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setCartItems(updatedCartItems);
      },
      (err) => {
        console.error("Error listening to cart:", err);
        setError("Failed to update cart items.");
      }
    );

    // Cleanup listeners on component unmount
    return () => {
      unsubscribeAddresses();
      unsubscribeCart();
    };
  }, [user, setInitiallySelectedAddress, fetchCartData, refreshTrigger]);

  return { userProfile, addresses, cartItems, loading, error, refreshData };
};

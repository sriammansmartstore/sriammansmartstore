import { useContext, useEffect, useState } from "react";
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

        // Fetch cart items (one-time)
        const cartColRef = collection(db, "users", user.uid, "cart");
        const cartSnap = await getDocs(cartColRef);
        setCartItems(cartSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
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

    // Cleanup listener on component unmount
    return () => unsubscribeAddresses();
  }, [user, setInitiallySelectedAddress]);

  return { userProfile, addresses, cartItems, loading, error };
};

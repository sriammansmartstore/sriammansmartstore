import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Divider, 
  IconButton, 
  CircularProgress 
} from '@mui/material';
import { 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { db } from '../../firebase';
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import { useContext } from 'react';

const OrderSummaryCard = ({ summary, onUpdateCart }) => {
  const items = summary?.items || [];
  
  // Debug: Log the items when they change
  React.useEffect(() => {
    console.log('Cart items:', items);
    if (items.length > 0) {
      console.log('First item keys:', Object.keys(items[0]));
    }
  }, [items]);
  // Enhanced price calculation function
  const getItemPrices = (item) => {
    if (!item) return { mrp: 0, price: 0 };
    
    console.log('Getting prices for item:', item);
    
    // Default values
    let mrp = 0;
    let price = item.price || 0;
    
    // Try to find matching option
    if (Array.isArray(item.options)) {
      const matchedOption = item.options.find(opt => 
        opt && 
        opt.unit === item.unit && 
        String(opt.unitSize) === String(item.unitSize)
      );
      
      if (matchedOption) {
        mrp = matchedOption.mrp || matchedOption.sellingPrice || price;
        price = matchedOption.sellingPrice || price;
      } else if (item.options.length > 0) {
        // Fallback to first option if no match found
        mrp = item.options[0].mrp || item.options[0].sellingPrice || price;
        price = item.options[0].sellingPrice || price;
      }
    }
    
    // If still no MRP, use item's own fields
    if (!mrp) {
      mrp = item.mrp || item.sellingPrice || price;
    }
    
    // Ensure price is a number
    price = Number(price) || 0;
    mrp = Number(mrp) || price;
    
    console.log('Calculated prices:', { mrp, price });
    return { mrp, price };
  };
  const { user: currentUser } = useContext(AuthContext);
  const [updatingItem, setUpdatingItem] = useState(null);

  const handleQuantityChange = async (itemId, newQty) => {
    console.log('handleQuantityChange called with:', { itemId, newQty });
    
    if (!currentUser?.uid) {
      console.error('No user logged in');
      return;
    }
    
    if (newQty < 1) {
      handleDelete(itemId);
      return;
    }
    
    if (!itemId) {
      console.error('No item ID provided');
      console.log('Current items:', items);
      return;
    }
    
    // Find the item by any identifier
    const item = items.find(item => 
      item.id === itemId || 
      item.cartItemId === itemId ||
      `item-${items.indexOf(item)}` === itemId
    );
    
    if (!item) {
      console.error('Item not found in cart:', itemId);
      console.log('Available items:', items.map((i, idx) => ({
        id: i.id,
        cartItemId: i.cartItemId,
        name: i.name,
        index: idx,
        indexId: `item-${idx}`
      })));
      return;
    }
    
    // Use the Firestore document ID directly
    if (!item.id) {
      console.error('No document ID found for item:', item);
      return;
    }
    
    const docId = item.id; // Always use the Firestore document ID
    
    // Prevent multiple clicks while updating
    if (updatingItem === docId) {
      console.log('Update already in progress for item:', docId);
      return;
    }
    
    setUpdatingItem(docId);
    
    try {
      console.log('Updating quantity in Firestore...');
      const itemRef = doc(db, 'users', currentUser.uid, 'cart', docId);
      
      await updateDoc(itemRef, { 
        quantity: Number(newQty),
        lastUpdated: new Date().toISOString()
      });
      
      console.log('Quantity updated successfully');
      
      // Force a refresh of the cart data
      if (onUpdateCart) {
        console.log('Triggering cart update...');
        await onUpdateCart();
      }
    } catch (error) {
      console.error('Error updating quantity:', {
        error,
        itemId,
        newQty,
        userId: currentUser?.uid,
        timestamp: new Date().toISOString()
      });
      
      // Show error to user if notification system is available
      if (window.notify) {
        window.notify('Failed to update quantity. Please try again.', 'error');
      }
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleDelete = async (itemId) => {
    console.log('Attempting to delete item:', itemId);
    
    if (!currentUser?.uid || !itemId) {
      console.error('Cannot delete: Missing user ID or item ID');
      return;
    }
    
    // Find the item by any identifier
    const item = items.find(item => 
      item.id === itemId || 
      item.cartItemId === itemId ||
      `item-${items.indexOf(item)}` === itemId
    );
    
    if (!item) {
      console.error('Item not found for deletion:', itemId);
      console.log('Available items:', items.map((i, idx) => ({
        id: i.id,
        cartItemId: i.cartItemId,
        name: i.name,
        index: idx,
        indexId: `item-${idx}`
      })));
      return;
    }
    
    // Use the Firestore document ID directly
    if (!item.id) {
      console.error('No document ID found for item:', item);
      return;
    }
    
    const docId = item.id;
    
    setUpdatingItem(docId);
    
    try {
      console.log('Deleting item from cart:', docId);
      const itemRef = doc(db, 'users', currentUser.uid, 'cart', docId);
      await deleteDoc(itemRef);
      console.log('Item deleted successfully');
      
      if (onUpdateCart) {
        console.log('Triggering cart update after delete...');
        await onUpdateCart();
      }
    } catch (error) {
      console.error('Error deleting item:', {
        error,
        itemId,
        userId: currentUser.uid,
        timestamp: new Date().toISOString()
      });
      
      if (window.notify) {
        window.notify('Failed to remove item. Please try again.', 'error');
      }
    } finally {
      setUpdatingItem(null);
    }
  };
  
  // Calculate line totals using the correct property names from Firestore
  const lineTotals = items.map(item => {
    const { price } = getItemPrices(item);
    const qty = item.quantity || 1;
    return price * qty;
  });
  
  const subTotal = lineTotals.reduce((a, b) => a + b, 0);
  
  // Calculate savings (MRP - Selling Price) and MRP total
  let savings = 0;
  let mrpTotal = 0;
  
  items.forEach(item => {
    const { mrp, price } = getItemPrices(item);
    const qty = item.quantity || 1;
    mrpTotal += mrp * qty;
    savings += Math.max(0, (mrp - price) * qty);
  });
  
  // New calculation for savings percentage
  const savedPercentage = mrpTotal > 0 ? ((savings / mrpTotal) * 100).toFixed(2) : 0;

  // Currency formatter (Indian numbering)
  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <Card sx={{ 
      borderRadius: { xs: 0, sm: 2 },
      boxShadow: { xs: 'none', sm: 2 },
      mb: { xs: 1.5, sm: 2 }
    }}>
      <CardContent sx={{ py: 1, px: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '0.95rem', sm: '1rem' } }}>Order Summary</Typography>

        {items.map((item, index) => {
          // Use the Firestore document ID as the primary ID
          const itemId = item.id || `item-${index}`;
          const qty = item.quantity || item.qty || 1;
          const { mrp, price } = getItemPrices(item);
          const lineTotal = price * qty;
          const imageSrc = Array.isArray(item.imageUrls) 
            ? item.imageUrls[0] 
            : (item.imageUrl || item.image);
          
          console.log('Rendering cart item:', { 
            itemId, 
            qty,
            price,
            mrp,
            itemKeys: Object.keys(item) 
          });
          
          return (
            <React.Fragment key={itemId}>
              <Box sx={{ display: 'flex', alignItems: 'center', py: 0.75 }}>
                <Box sx={{ width: 48, height: 48, mr: 1, borderRadius: 1.5, overflow: 'hidden', bgcolor: 'grey.100' }}>
                  {imageSrc ? (
                    <img src={imageSrc} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : null}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 0.2,
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}
                  </Typography>
                  
                  {(item.unitSize && item.unit) && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 0.2, fontSize: '0.75rem' }}
                    >
                      {item.unitSize} {item.unit?.toUpperCase?.()}
                    </Typography>
                  )}
                  {/* Prices on the left: MRP (striked) + Selling price in one row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {mrp != null && (
                      <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through', fontSize: '0.75rem' }}>
                        {fmt(mrp)}
                      </Typography>
                    )}
                    <Typography 
                      variant="body2" 
                      sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.8rem' }}
                    >
                      {fmt(price)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, ml: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Delete button clicked for item:', itemId);
                        handleDelete(itemId);
                      }}
                      disabled={updatingItem === itemId}
                      sx={{ color: 'error.main', p: 0.5, alignSelf: 'flex-end' }}
                    >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Decrease quantity for item:', itemId);
                        handleQuantityChange(itemId, qty - 1);
                      }}
                      disabled={updatingItem === itemId || qty <= 1}
                      sx={{ p: 0.5 }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                      {updatingItem === itemId ? <CircularProgress size={16} /> : qty}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Increase quantity for item:', itemId);
                        handleQuantityChange(itemId, qty + 1);
                      }}
                      disabled={updatingItem === itemId}
                      sx={{ p: 0.5 }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
              {index < items.length - 1 && <Divider sx={{ my: 0.2 }} />}
            </React.Fragment>
          );
        })}

        <Divider sx={{ my: 1 }} />

        {/* Totals breakdown (no delivery/taxes/grand total here) */}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
          <Typography color="text.secondary">MRP Total</Typography>
          <Typography sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>{fmt(mrpTotal)}</Typography>
        </Box>
        {savings > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
            <Typography color="text.secondary">You Save</Typography>
            <Typography color="success.main">({savedPercentage}%) {fmt(savings)} </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
          <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Subtotal</Typography>
          <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>{fmt(subTotal)}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OrderSummaryCard;
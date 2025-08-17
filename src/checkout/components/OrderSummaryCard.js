import React from 'react';
import { Box, Typography, Card, CardContent, Divider } from '@mui/material';

const OrderSummaryCard = ({ summary }) => {
  const items = summary?.items || [];
  const extractMrp = (obj) => {
    if (!obj || typeof obj !== 'object') return undefined;
    // Direct known fields
    if (obj.mrp != null) return obj.mrp;
    if (obj.mrp12 != null) return obj.mrp12;
    // Dynamic keys like mrp1000
    const mrpKey = Object.keys(obj).find(k => /^mrp\d+$/i.test(k));
    if (mrpKey) return obj[mrpKey];
    return undefined;
  };
  const extractMrpForItem = (it) => {
    const unit = it.unit;
    const unitSize = it.unitSize;
    const options = Array.isArray(it.options) ? it.options : [];
    const matchedOption = options.find(o => o && o.unit === unit && o.unitSize === unitSize);
    return extractMrp(matchedOption) 
      ?? extractMrp(it.option) 
      ?? extractMrp(it)
      ?? extractMrp(options[0]);
  };
  const lineTotals = items.map(it => (it.price || 0) * (it.qty || 1));
  const subTotal = lineTotals.reduce((a, b) => a + b, 0);
  const savings = items.reduce((acc, it) => {
    const mrp = extractMrpForItem(it);
    const price = it.price || 0;
    const qty = it.qty || 1;
    return acc + Math.max(0, (mrp ? (mrp - price) : 0)) * qty;
  }, 0);
  const mrpTotal = items.reduce((acc, it) => {
    const unitMrp = (extractMrpForItem(it) ?? 0);
    const qty = it.qty || 1;
    return acc + unitMrp * qty;
  }, 0);
  
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
          const qty = item.qty || 1;
          const price = item.price || 0;
          const mrp = extractMrpForItem(item);
          const lineTotal = price * qty;
          const imageSrc = item.imageUrl || item.image || item.imageUrls?.[0];
          return (
            <React.Fragment key={`${item.id || item.name}-${index}`}>
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
                <Box sx={{ textAlign: 'right', minWidth: 80, ml: 1 }}>
                  {/* Right side: quantity on first line, total below */}
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.1 }}>
                    Qty = {qty}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '0.9rem', sm: '0.95rem' } }}>
                    {fmt(lineTotal)}
                  </Typography>
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
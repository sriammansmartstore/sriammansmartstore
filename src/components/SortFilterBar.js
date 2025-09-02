import React, { useState } from "react";
import { Box, Button, Slider, Typography, Checkbox, FormControlLabel, SwipeableDrawer, Chip, Stack } from "@mui/material";

const SORT_OPTIONS = [
  { value: "priceLowHigh", label: "Price: Low to High" },
  { value: "priceHighLow", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "nameAZ", label: "Name: A to Z" },
  { value: "nameZA", label: "Name: Z to A" },
  { value: "discount", label: "Highest Discount" },
  { value: "rating", label: "Top Rated" },
];

export default function SortFilterBar({
  sort, setSort,
  filters, setFilters,
  units, brands,
  minPrice, maxPrice,
  minDiscount, maxDiscount,
  minRating, maxRating,
  onApply,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const handleFilterClose = () => setIsFilterOpen(false);

  const toggleUnit = (u) => setFilters(f => ({ ...f, unit: f.unit.includes(u) ? f.unit.filter(x => x !== u) : [...f.unit, u] }));
  const toggleBrand = (b) => setFilters(f => ({ ...f, brand: f.brand.includes(b) ? f.brand.filter(x => x !== b) : [...f.brand, b] }));
  const resetFilters = () => setFilters({
    price: [minPrice, maxPrice],
    discount: [minDiscount, maxDiscount],
    rating: [minRating, maxRating],
    unit: [],
    brand: [],
    available: false,
  });

  // Allow global control via events from BottomNavbar
  React.useEffect(() => {
    const open = () => setIsFilterOpen(true);
    const close = () => setIsFilterOpen(false);
    const toggle = () => setIsFilterOpen(prev => !prev);
    window.addEventListener('open-filters', open);
    window.addEventListener('close-filters', close);
    window.addEventListener('toggle-filters', toggle);
    return () => {
      window.removeEventListener('open-filters', open);
      window.removeEventListener('close-filters', close);
      window.removeEventListener('toggle-filters', toggle);
    };
  }, []);

  // Active filters count for header badge
  const activeCount = (
    (filters.price[0] > minPrice || filters.price[1] < maxPrice ? 1 : 0) +
    (filters.discount[0] > minDiscount || filters.discount[1] < maxDiscount ? 1 : 0) +
    (filters.rating[0] > minRating || filters.rating[1] < maxRating ? 1 : 0) +
    (filters.unit.length > 0 ? 1 : 0) +
    (filters.brand.length > 0 ? 1 : 0) +
    (filters.available ? 1 : 0)
  );

  return (
    <Box sx={{ display: 'contents' }}>
      {/* Hidden inline bar; we now use the bottom bump in BottomNavbar */}
      <Box sx={{ display: 'none' }} />
      {/* Sort/Filter Bottom Sheet */}
      <SwipeableDrawer
        anchor="bottom"
        open={isFilterOpen}
        onOpen={() => setIsFilterOpen(true)}
        onClose={handleFilterClose}
        PaperProps={{ sx: { borderTopLeftRadius: 14, borderTopRightRadius: 14, zIndex: 1400, height: '56vh', maxHeight: '56vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', overflowX: 'hidden', touchAction: 'pan-y', overscrollBehavior: 'contain' } }}
        ModalProps={{ keepMounted: true, BackdropProps: { sx: { zIndex: 1399 } } }}
      >
        {/* Header (sticky) */}
        <Box sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', px: 1.5, pt: 1, pb: 0.75, borderTopLeftRadius: 14, borderTopRightRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', backdropFilter: 'saturate(180%) blur(6px)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
            <Box sx={{ width: 28, height: 3, bgcolor: 'text.disabled', borderRadius: 2 }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Sort & Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
            </Typography>
            <Button size="small" color="inherit" onClick={resetFilters} sx={{ textTransform: 'none', minWidth: 0, px: 1 }}>Clear all</Button>
          </Box>
        </Box>

        {/* Content (scrollable) */}
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 1.5, pt: 0.75, pb: 0.5, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
          {/* Sort options as chips */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.25 }}>Sort By</Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {SORT_OPTIONS.map(opt => (
                <Chip size="small" key={opt.value} label={opt.label} onClick={() => setSort(opt.value)} color={sort === opt.value ? 'success' : 'default'} variant={sort === opt.value ? 'filled' : 'outlined'} sx={{ mb: 0.5 }} />
              ))}
            </Stack>
          </Box>

          <Typography variant="subtitle2">Price Range</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption">₹{minPrice}</Typography>
            <Typography variant="caption">₹{maxPrice}</Typography>
          </Box>
          <Slider size="small" value={filters.price} min={minPrice} max={maxPrice} onChange={(_, v) => setFilters(f => ({ ...f, price: v }))} valueLabelDisplay="auto" sx={{ mb: 1, '& .MuiSlider-thumb': { width: 14, height: 14 }, '& .MuiSlider-rail, & .MuiSlider-track': { height: 3 } }} />

          <Typography variant="subtitle2">Discount %</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption">{minDiscount}%</Typography>
            <Typography variant="caption">{maxDiscount}%</Typography>
          </Box>
          <Slider size="small" value={filters.discount} min={minDiscount} max={maxDiscount} onChange={(_, v) => setFilters(f => ({ ...f, discount: v }))} valueLabelDisplay="auto" sx={{ mb: 1, '& .MuiSlider-thumb': { width: 14, height: 14 }, '& .MuiSlider-rail, & .MuiSlider-track': { height: 3 } }} />

          <Typography variant="subtitle2">Rating</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption">{minRating}★</Typography>
            <Typography variant="caption">{maxRating}★</Typography>
          </Box>
          <Slider size="small" value={filters.rating} min={minRating} max={maxRating} step={0.1} onChange={(_, v) => setFilters(f => ({ ...f, rating: v }))} valueLabelDisplay="auto" sx={{ mb: 1, '& .MuiSlider-thumb': { width: 14, height: 14 }, '& .MuiSlider-rail, & .MuiSlider-track': { height: 3 } }} />

          {units?.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.25 }}>Unit</Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {units.map(u => (
                  <Chip size="small" key={u} label={u} onClick={() => toggleUnit(u)} color={filters.unit.includes(u) ? 'success' : 'default'} variant={filters.unit.includes(u) ? 'filled' : 'outlined'} sx={{ mb: 0.5 }} />
                ))}
              </Stack>
            </Box>
          )}

          {brands?.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.25 }}>Brand</Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {brands.map(b => (
                  <Chip size="small" key={b} label={b} onClick={() => toggleBrand(b)} color={filters.brand.includes(b) ? 'success' : 'default'} variant={filters.brand.includes(b) ? 'filled' : 'outlined'} sx={{ mb: 0.5 }} />
                ))}
              </Stack>
            </Box>
          )}

          <FormControlLabel sx={{ mt: 0.25 }} control={<Checkbox size="small" checked={filters.available} onChange={(_, checked) => setFilters(f => ({ ...f, available: checked }))} />} label={<Typography variant="body2">In Stock Only</Typography>} />
        </Box>

        {/* Footer (fixed) */}
        <Box sx={{ p: 1, pt: 0.5, display: 'flex', gap: 0.75, bgcolor: 'background.paper', borderTop: theme => `1px solid ${theme.palette.divider}`, boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
          <Button size="small" variant="outlined" color="inherit" fullWidth onClick={resetFilters}>Reset</Button>
          <Button size="small" variant="contained" color="success" fullWidth onClick={() => { handleFilterClose(); if (onApply) onApply(); }}>Apply</Button>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
}

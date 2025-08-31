import React, { useRef, useState } from "react";
import { Box, Button, Menu, MenuItem, Slider, Typography, IconButton, TextField, Checkbox, FormControlLabel, Divider } from "@mui/material";
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';

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

const DEFAULT_FILTERS = {
  price: [0, 10000],
  discount: [0, 100],
  rating: [0, 5],
  unit: [],
  brand: [],
  available: false,
};

const SortFilterBar = ({
  sort, setSort,
  filters, setFilters,
  units, brands,
  minPrice, maxPrice,
  minDiscount, maxDiscount,
  minRating, maxRating,
  onApply,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const sortAnchorRef = useRef(null);
  const filterAnchorRef = useRef(null);

  const handleSortClick = (event) => setAnchorEl(sortAnchorRef.current || event.currentTarget);
  const handleSortClose = () => setAnchorEl(null);
  const handleSortSelect = (option) => {
    setSort(option);
    setAnchorEl(null);
    if (onApply) onApply();
  };

  const handleFilterClick = (event) => setFilterAnchorEl(filterAnchorRef.current || event.currentTarget);
  const handleFilterClose = () => setFilterAnchorEl(null);

  // ...existing code...

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'space-between',
      gap: 0,
      mb: 0,
      px: 0,
      py: 0,
      bgcolor: 'transparent',
      height: 44,
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        width: '100%',
        background: 'linear-gradient(90deg, #43a047 0%, #2e7d32 100%)',
        color: '#fff',
        borderRadius: 0,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.12)',
      }}>
      <Box
        ref={sortAnchorRef}
        onClick={handleSortClick}
        role="button"
        aria-label="open sort menu"
        sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, cursor: 'pointer', userSelect: 'none', color: '#fff', ':hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
      >
        <SortIcon sx={{ color: '#fff' }} fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>Sort</Typography>
      </Box>
      <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.3)' }} />
      <Box
        ref={filterAnchorRef}
        onClick={handleFilterClick}
        role="button"
        aria-label="open filter menu"
        sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, cursor: 'pointer', userSelect: 'none', color: '#fff', ':hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
      >
        <FilterListIcon sx={{ color: '#fff' }} fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>Filter</Typography>
      </Box>
      </Box>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleSortClose}>
        {SORT_OPTIONS.map(opt => (
          <MenuItem key={opt.value} selected={sort === opt.value} onClick={() => handleSortSelect(opt.value)}>{opt.label}</MenuItem>
        ))}
      </Menu>
      <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={handleFilterClose}>
        <Box sx={{ px: 2, py: 1, minWidth: 260 }}>
          <Typography variant="subtitle2">Price Range</Typography>
          <Slider value={filters.price} min={minPrice} max={maxPrice} onChange={(_, v) => setFilters(f => ({ ...f, price: v }))} valueLabelDisplay="auto" />
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Discount %</Typography>
          <Slider value={filters.discount} min={minDiscount} max={maxDiscount} onChange={(_, v) => setFilters(f => ({ ...f, discount: v }))} valueLabelDisplay="auto" />
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Rating</Typography>
          <Slider value={filters.rating} min={minRating} max={maxRating} step={0.1} onChange={(_, v) => setFilters(f => ({ ...f, rating: v }))} valueLabelDisplay="auto" />
          {units?.length > 0 && <>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Unit</Typography>
            {units.map(u => (
              <FormControlLabel key={u} control={<Checkbox checked={filters.unit.includes(u)} onChange={(_, checked) => setFilters(f => ({ ...f, unit: checked ? [...f.unit, u] : f.unit.filter(x => x !== u) }))} />} label={u} />
            ))}
          </>}
          {brands?.length > 0 && <>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Brand</Typography>
            {brands.map(b => (
              <FormControlLabel key={b} control={<Checkbox checked={filters.brand.includes(b)} onChange={(_, checked) => setFilters(f => ({ ...f, brand: checked ? [...f.brand, b] : f.brand.filter(x => x !== b) }))} />} label={b} />
            ))}
          </>}
          <FormControlLabel sx={{ mt: 2 }} control={<Checkbox checked={filters.available} onChange={(_, checked) => setFilters(f => ({ ...f, available: checked }))} />} label="In Stock Only" />
          <Button variant="contained" color="primary" sx={{ mt: 2, width: '100%' }} onClick={() => { handleFilterClose(); if (onApply) onApply(); }}>Apply</Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default SortFilterBar;

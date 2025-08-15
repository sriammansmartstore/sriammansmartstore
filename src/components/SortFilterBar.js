import React, { useState } from "react";
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

  const handleSortClick = (event) => setAnchorEl(event.currentTarget);
  const handleSortClose = () => setAnchorEl(null);
  const handleSortSelect = (option) => {
    setSort(option);
    setAnchorEl(null);
    if (onApply) onApply();
  };

  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget);
  const handleFilterClose = () => setFilterAnchorEl(null);

  // ...existing code...

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, px: 2, pt: 1, pb: 1, bgcolor: '#f7f7f7', borderRadius: 2, boxShadow: 1 }}>
      <IconButton onClick={handleSortClick} color="primary"><SortIcon /></IconButton>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>Sort</Typography>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleSortClose}>
        {SORT_OPTIONS.map(opt => (
          <MenuItem key={opt.value} selected={sort === opt.value} onClick={() => handleSortSelect(opt.value)}>{opt.label}</MenuItem>
        ))}
      </Menu>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <IconButton onClick={handleFilterClick} color="primary"><FilterListIcon /></IconButton>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>Filter</Typography>
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

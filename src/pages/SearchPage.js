import React, { useState } from "react";
import { Box, Typography, TextField, Card, CardContent } from "@mui/material";
import './SearchPage.css';

const products = [
  { id: 1, name: "Organic Rice", price: "₹120" },
  { id: 2, name: "Fresh Vegetables", price: "₹80" },
  { id: 3, name: "Dairy Products", price: "₹60" },
];

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const results = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <Box className="search-root">
      <Typography variant="h5" className="search-title">Search Products</Typography>
      <TextField
        className="search-bar"
        label="Search"
        variant="outlined"
        fullWidth
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <Box className="search-results">
        {results.map(product => (
          <Card key={product.id} className="search-result-card">
            <CardContent>
              <Typography variant="h6">{product.name}</Typography>
              <Typography variant="body2">{product.price}</Typography>
            </CardContent>
          </Card>
        ))}
        {results.length === 0 && (
          <Typography variant="body2" color="text.secondary">No products found.</Typography>
        )}
      </Box>
    </Box>
  );
};
export default SearchPage;

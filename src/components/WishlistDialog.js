import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Typography,
  Box,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';

const WishlistDialog = ({
  open,
  onClose,
  mode, // 'manage' or 'add'
  setMode,
  wishlists,
  product,
  selectedOption,
  optionsInWishlists,
  onRemoveFromWishlist,
  onAddToWishlist,
  newWishlistName,
  setNewWishlistName,
  onCreateWishlist
}) => {
  const getOptionLabel = (option) => {
    return `${option.unitSize} ${option.unit}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {mode === 'manage' ? 'Manage Wishlist' : 'Add to Wishlist'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {mode === 'manage' ? (
          <>
            {Object.keys(optionsInWishlists).length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ my: 2 }}>
                This product is not in any wishlist
              </Typography>
            ) : (
              <List>
                {Object.entries(optionsInWishlists).map(([wishlistId, options]) => (
                  <React.Fragment key={wishlistId}>
                    <ListItem>
                      <ListItemText
                        primary={wishlists.find(w => w.id === wishlistId)?.name || wishlistId}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            {options.map((option, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  mb: 1
                                }}
                              >
                                <Typography variant="body2">
                                  {getOptionLabel(option)}
                                </Typography>
                                <IconButton
                                  edge="end"
                                  aria-label="delete"
                                  onClick={() => onRemoveFromWishlist(wishlistId, option)}
                                  size="small"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
            <Button
              startIcon={<AddIcon />}
              onClick={() => setMode('add')}
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
            >
              Add to Another Wishlist
            </Button>
          </>
        ) : (
          <>
            <List>
              {/* Always show General wishlist first */}
              {!optionsInWishlists['general']?.find(opt => 
                opt.unit === selectedOption.unit && opt.unitSize === selectedOption.unitSize
              ) && (
                <ListItem button onClick={() => onAddToWishlist('general', selectedOption)}>
                  <ListItemText primary="General" />
                </ListItem>
              )}
              
              {/* Show other wishlists */}
              {wishlists.filter(w => w.id !== 'general').map(wishlist => {
                const hasOption = optionsInWishlists[wishlist.id]?.find(opt =>
                  opt.unit === selectedOption.unit && opt.unitSize === selectedOption.unitSize
                );
                
                if (hasOption) return null;
                
                return (
                  <ListItem
                    button
                    key={wishlist.id}
                    onClick={() => onAddToWishlist(wishlist.id, selectedOption)}
                  >
                    <ListItemText primary={wishlist.name} />
                  </ListItem>
                );
              })}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Create new wishlist section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Create New Wishlist
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Enter wishlist name"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                />
                <Button
                  variant="contained"
                  onClick={onCreateWishlist}
                  disabled={!newWishlistName.trim()}
                >
                  Create
                </Button>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WishlistDialog;

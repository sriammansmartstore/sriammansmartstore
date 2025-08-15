import React, { useState, useEffect } from "react";
import { Box, IconButton, CircularProgress } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { app } from "../firebase";

const BannerSlideshow = () => {
  const [images, setImages] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const storage = getStorage(app);
        const listRef = ref(storage, "slideshow");
        const res = await listAll(listRef);
        const urls = await Promise.all(res.items.map((itemRef) => getDownloadURL(itemRef)));
        setImages(urls);
      } catch (error) {
        console.error("Error loading slideshow images:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    if (!loading && images.length > 0) {
      const timer = setInterval(() => {
        setCurrent((prev) => (prev + 1) % images.length);
      }, 3500);
      return () => clearInterval(timer);
    }
  }, [loading, images]);

  const goPrev = () => setCurrent((prev) => (prev - 1 + images.length) % images.length);
  const goNext = () => setCurrent((prev) => (prev + 1) % images.length);

  return (
    <>
      <Box sx={{ position: 'relative', width: '100%', height: { xs: 180, sm: 260 }, mb: 0, borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
        {loading ? (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : images.length > 0 ? (
          <>
            <img
              src={images[current]}
              alt={`Banner ${current + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <IconButton
              onClick={goPrev}
              sx={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', borderRadius: 2 }}
              aria-label="Previous banner"
            >
              <ArrowBackIosNewIcon />
            </IconButton>
            <IconButton
              onClick={goNext}
              sx={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', borderRadius: 2 }}
              aria-label="Next banner"
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </>
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            No banners found
          </Box>
        )}
      </Box>
      {/* Dots outside the slideshow box */}
      {!loading && images.length > 0 && (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1.5, mb: 2 }}>
          {images.map((_, idx) => (
            <Box
              key={idx}
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: current === idx ? '#ffffffff' : '#388e3c',
                border: current === idx ? '1px solid #388e3c' : '2px solid #ffffffff',
                boxShadow: 'none',
                mx: 0.7,
                transition: 'background 0.2s, border 0.2s'
              }}
            />
          ))}
        </Box>
      )}
    </>
  );
};

export default BannerSlideshow;

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { keyframes } from '@emotion/react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// Simple marquee-style animation
const scroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

function OfferScroller() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const colRef = collection(db, 'offer_message');
    const unsub = onSnapshot(colRef, (snap) => {
      const items = [];
      snap.forEach((doc) => {
        const data = doc.data() || {};
        // Support common field names: message/text/title
        const msg = data.message || data.text || data.title;
        if (msg && typeof msg === 'string') items.push(msg.trim());
      });
      setMessages(items);
    });
    return () => unsub();
  }, []);

  const concatenated = messages.length > 0 ? messages.join('  •  ') : 'Welcome to Sri Amman Smart Store  •  Fresh deals every day  •  Fast delivery';

  // Duplicate content to enable seamless infinite scroll
  const marqueeContent = `${concatenated}     ${concatenated}`;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 48, // just below AppBar toolbar height
        left: 0,
        right: 0,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: (theme) => theme.zIndex.appBar - 1 + 2, // above page content
        bgcolor: '#fff',
        color: (theme) => theme.palette.primary.main,
      }}
    >
      <Box
        sx={{
          whiteSpace: 'nowrap',
          display: 'inline-block',
          px: 2,
          animation: `${scroll} 18s linear infinite`,
          '&:hover': { animationPlayState: 'paused' }
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.3,
            color: (theme) => theme.palette.primary.main,
            textShadow: 'none'
          }}
        >
          {marqueeContent}
        </Typography>
      </Box>
    </Box>
  );
}

export default OfferScroller;

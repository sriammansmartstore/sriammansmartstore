import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  IconButton,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Chip
} from '@mui/material';
import { useNotification } from '../components/NotificationProvider';
import {
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  Send as SendIcon,
  ContactSupport as ContactSupportIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ContactPage = () => {
  const navigate = useNavigate();
  const notify = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.message) {
        notify('Please fill in all required fields', 'warning');
        setLoading(false);
        return;
      }

      // Submit to Firebase with complete user information
      await addDoc(collection(db, 'contact-submissions'), {
        // Form data
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: formData.subject || null,
        message: formData.message,
        
        // Submission metadata
        submittedAt: serverTimestamp(),
        status: 'new',
        priority: 'normal',
        
        // User information
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        
        // Contact source
        source: 'contact_page',
        referrer: document.referrer || 'direct',
        
        // Additional tracking
        sessionId: Date.now().toString(),
        ipAddress: null, // Will be populated by server if needed
        
        // Contact preferences
        preferredContactMethod: formData.phone ? 'phone' : 'email',
        
        // Submission details
        formVersion: '1.0',
        pageUrl: window.location.href,
        
        // Response tracking
        responded: false,
        responseDate: null,
        assignedTo: null,
        notes: []
      });

      setSubmitted(true);
      notify('Message sent successfully! We\'ll get back to you within 24 hours.', 'success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      console.error('Error submitting contact form:', err);
      notify('Failed to submit your message. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = {
    phone: '+91 9876543210',
    email: 'support@sriammansmartstore.in',
    whatsapp: '+919876543210',
    address: '8, Nataraj Street, Kasipalayam, Erode, Tamil Nadu 638001',
    hours: 'Mon - Sat: 9:00 AM - 8:00 PM'
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent('Hi! I need help with Sri Amman Smart Store.');
    window.open(`https://wa.me/${contactInfo.whatsapp.replace('+', '')}?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.open(`tel:${contactInfo.phone}`, '_self');
  };

  const handleEmail = () => {
    window.open(`mailto:${contactInfo.email}?subject=Support Request`, '_self');
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* Header - Only padded on desktop */}
      <Box sx={{ 
        p: { xs: 1, sm: 2, md: 3 }, 
        maxWidth: { md: 1200 }, 
        mx: { md: 'auto' },
        width: '100%'
      }}>
        <Box display="flex" alignItems="center" mb={{ xs: 2, md: 3 }}>
          <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ flex: 1, fontWeight: 700 }}>Contact Us</Typography>
          <Chip 
            icon={<ContactSupportIcon />}
            label="Support" 
            color="primary" 
            size="small" 
          />
        </Box>
      </Box>

      {/* Contact Information - Compact on mobile, full on desktop */}
      <Box sx={{ 
        p: { xs: 2, md: 3 },
        maxWidth: { md: 1200 },
        mx: { md: 'auto' },
        width: '100%'
      }}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: { xs: 1, md: 2 }, boxShadow: 2, mb: { xs: 2, md: 3 } }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Get in Touch</Typography>
              
              <Stack spacing={2}>
                {/* Phone */}
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <PhoneIcon sx={{ color: 'primary.main', mr: 2 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Phone</Typography>
                    <Typography variant="body2" color="text.secondary">{contactInfo.phone}</Typography>
                  </Box>
                </Box>

                {/* Email */}
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <EmailIcon sx={{ color: 'primary.main', mr: 2 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Email</Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        wordBreak: 'break-all',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      {contactInfo.email}
                    </Typography>
                  </Box>
                </Box>

                {/* WhatsApp */}
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                  <WhatsAppIcon sx={{ color: 'success.dark', mr: 2 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>WhatsApp</Typography>
                    <Typography variant="body2" color="text.secondary">Quick support via WhatsApp</Typography>
                  </Box>
                  <Button 
                    variant="contained" 
                    size="small" 
                    onClick={handleWhatsApp}
                    sx={{ 
                      bgcolor: 'success.main', 
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'success.dark' }
                    }}
                  >
                    Chat
                  </Button>
                </Box>

                {/* Address */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <LocationOnIcon sx={{ color: 'primary.main', mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Address</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      {contactInfo.address}
                    </Typography>
                  </Box>
                </Box>

                {/* Hours */}
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <AccessTimeIcon sx={{ color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Business Hours</Typography>
                    <Typography variant="body2" color="text.secondary">{contactInfo.hours}</Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Contact Form - Full width on mobile */}
      <Box sx={{ width: '100%' }}>
        <Card sx={{ 
          borderRadius: { xs: 0, md: 2 }, 
          boxShadow: { xs: 0, md: 2 },
          width: '100%',
          maxWidth: { md: 800 },
          mx: { md: 'auto' },
          m: { md: 3 }
        }}>
          <CardContent sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            width: '100%'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Send us a Message</Typography>
              
              {submitted && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Message sent successfully!</Typography>
                  <Typography variant="body2">We'll get back to you within 24 hours.</Typography>
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    name="name"
                    label="Full Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    fullWidth
                    variant="outlined"
                    disabled={loading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <TextField
                    name="email"
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    fullWidth
                    variant="outlined"
                    disabled={loading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <TextField
                    name="phone"
                    label="Phone Number (Optional)"
                    value={formData.phone}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    disabled={loading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <TextField
                    name="subject"
                    label="Subject (Optional)"
                    value={formData.subject}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    disabled={loading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <TextField
                    name="message"
                    label="Your Message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    fullWidth
                    multiline
                    rows={{ xs: 3, sm: 4 }}
                    variant="outlined"
                    disabled={loading}
                    placeholder="Tell us how we can help you..."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                    sx={{ 
                      fontWeight: 600, 
                      borderRadius: 2, 
                      py: 1.5,
                      fontSize: '1rem'
                    }}
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ 
        p: { xs: 2, md: 3 },
        maxWidth: { md: 1200 },
        mx: { md: 'auto' },
        width: '100%'
      }}>
        <Card sx={{ 
          borderRadius: { xs: 1, md: 2 }, 
          boxShadow: 2,
          width: '100%'
        }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>Quick Actions</Typography>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 2, sm: 3 }}
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PhoneIcon />}
              onClick={handleCall}
              sx={{ 
                py: { xs: 1.5, sm: 1.8 }, 
                fontWeight: 600,
                borderRadius: 2,
                fontSize: { xs: '0.95rem', sm: '1rem' },
                flex: 1
                }}
              >
                Call Now
              </Button>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<WhatsAppIcon />}
              onClick={handleWhatsApp}
              sx={{ 
                py: { xs: 1.5, sm: 1.8 }, 
                fontWeight: 600,
                borderRadius: 2,
                fontSize: { xs: '0.95rem', sm: '1rem' },
                color: 'success.main',
                borderColor: 'success.main',
                flex: 1,
                '&:hover': {
                  bgcolor: 'success.light',
                  borderColor: 'success.dark'
                }
              }}
            >
              WhatsApp
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<EmailIcon />}
              onClick={handleEmail}
              sx={{ 
                py: { xs: 1.5, sm: 1.8 }, 
                fontWeight: 600,
                borderRadius: 2,
                fontSize: { xs: '0.95rem', sm: '1rem' },
                flex: 1
              }}
            >
              Send Email
            </Button>
          </Stack>
        </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ContactPage;

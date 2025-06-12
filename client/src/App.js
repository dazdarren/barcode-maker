import React, { useState, useRef } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFFFFF', // White for a clean, minimal look
    },
    secondary: {
      main: '#CCCCCC', // Light gray for secondary elements
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 4,
  },
});

function App() {
  const [barcodeData, setBarcodeData] = useState('');
  const [barcodeType, setBarcodeType] = useState('CODE128');
  const [labelText, setLabelText] = useState('');
  const barcodeRef = useRef();
  const svgRef = useRef();
  const canvasRef = useRef();

  // Helper function to calculate EAN-13 check digit
  const calculateEAN13CheckDigit = (code) => {
    const digits = code.slice(0, 12).split('').map(Number);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (sum % 10)) % 10;
  };

  // Helper function to calculate UPC-A check digit
  const calculateUPCCheckDigit = (code) => {
    const digits = code.slice(0, 11).split('').map(Number);
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }
    return (10 - (sum % 10)) % 10;
  };

  const generateBarcode = async () => {
    if (!barcodeData) return;

    if (barcodeType === 'QR') {
      // Generate QR Code
      if (canvasRef.current) {
        try {
          await QRCode.toCanvas(canvasRef.current, barcodeData, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          // Hide SVG when showing QR code
          if (svgRef.current) {
            svgRef.current.style.display = 'none';
          }
          canvasRef.current.style.display = 'block';
        } catch (error) {
          console.error('Error generating QR code:', error);
          alert(`Error generating QR code: ${error.message}`);
        }
      }
    } else {
      // Generate traditional barcode
      if (svgRef.current) {
        try {
          let barcodeOptions = {
            format: barcodeType,
            width: 2,
            height: 100,
            displayValue: true,
            fontSize: 20,
            margin: 10
          };

          // Handle UPC-A specifically
          if (barcodeType === 'UPC') {
            // UPC-A requires exactly 12 digits
            let upcData = barcodeData.replace(/\D/g, ''); // Remove non-digits
            if (upcData.length === 0) {
              alert('Please enter some numbers for UPC code');
              return;
            }
            
            if (upcData.length < 11) {
              upcData = upcData.padStart(11, '0'); // Pad to 11 digits
            } else if (upcData.length > 11) {
              upcData = upcData.substring(0, 11); // Truncate to 11
            }
            
            // Calculate and add check digit
            const checkDigit = calculateUPCCheckDigit(upcData);
            upcData = upcData + checkDigit;
            
            JsBarcode(svgRef.current, upcData, {
              ...barcodeOptions,
              format: 'UPC'
            });
          } 
          // Handle EAN-13 specifically
          else if (barcodeType === 'EAN13') {
            // EAN-13 requires exactly 13 digits
            let eanData = barcodeData.replace(/\D/g, ''); // Remove non-digits
            if (eanData.length === 0) {
              alert('Please enter some numbers for EAN-13 code');
              return;
            }
            
            if (eanData.length < 12) {
              eanData = eanData.padStart(12, '0'); // Pad to 12 digits
            } else if (eanData.length > 12) {
              eanData = eanData.substring(0, 12); // Truncate to 12
            }
            
            // Calculate and add check digit
            const checkDigit = calculateEAN13CheckDigit(eanData);
            eanData = eanData + checkDigit;
            
            JsBarcode(svgRef.current, eanData, {
              ...barcodeOptions,
              format: 'EAN13'
            });
          }
          // Handle other barcode types normally
          else {
            if (!barcodeData.trim()) {
              alert('Please enter data for the barcode');
              return;
            }
            JsBarcode(svgRef.current, barcodeData, barcodeOptions);
          }

          // Hide canvas when showing barcode
          if (canvasRef.current) {
            canvasRef.current.style.display = 'none';
          }
          svgRef.current.style.display = 'block';
        } catch (error) {
          console.error('Error generating barcode:', error);
          alert(`Error generating ${barcodeType}: ${error.message || 'Invalid barcode data'}`);
        }
      }
    }
  };

  const downloadLabel = async () => {
    if (barcodeRef.current) {
      const canvas = await html2canvas(barcodeRef.current);
      const link = document.createElement('a');
      link.download = `${barcodeType === 'QR' ? 'qrcode' : 'barcode'}-${barcodeData}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: '#121212',
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ my: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ color: 'primary.main', mb: 4 }}>
              Retail Barcode Label Generator
            </Typography>

            <Paper elevation={1} sx={{ p: 4, mb: 4, borderRadius: 1, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={
                      barcodeType === 'QR' ? 'QR Code Data (URL, text, etc.)' :
                      barcodeType === 'UPC' ? 'UPC Code (12 digits, e.g., 123456789012)' :
                      barcodeType === 'EAN13' ? 'EAN-13 Code (13 digits, e.g., 1234567890123)' :
                      'Barcode Data'
                    }
                    value={barcodeData}
                    onChange={(e) => setBarcodeData(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Code Type</InputLabel>
                    <Select
                      value={barcodeType}
                      label="Code Type"
                      onChange={(e) => setBarcodeType(e.target.value)}
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value="QR">QR Code</MenuItem>
                      <MenuItem value="CODE128">Code 128</MenuItem>
                      <MenuItem value="EAN13">EAN-13</MenuItem>
                      <MenuItem value="UPC">UPC</MenuItem>
                      <MenuItem value="CODE39">Code 39</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Label Text"
                    value={labelText}
                    onChange={(e) => setLabelText(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={generateBarcode}
                  disabled={!barcodeData}
                  sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 500, px: 4, py: 1.5 }}
                >
                  Generate {barcodeType === 'QR' ? 'QR Code' : 'Barcode'}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={downloadLabel}
                  disabled={!barcodeData}
                  sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 500, px: 4, py: 1.5 }}
                >
                  Download Label
                </Button>
              </Box>
            </Paper>

            <Paper elevation={1} sx={{ p: 4, textAlign: 'center', borderRadius: 1, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
              <Box ref={barcodeRef}>
                <svg ref={svgRef} id="barcode" style={{ display: 'block' }}></svg>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                {labelText && (
                  <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
                    {labelText}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;

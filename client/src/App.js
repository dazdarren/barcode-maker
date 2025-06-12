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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';

function App() {
  const [barcodeData, setBarcodeData] = useState('');
  const [barcodeType, setBarcodeType] = useState('CODE128');
  const [labelText, setLabelText] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [batchItems, setBatchItems] = useState([]);
  const [batchType, setBatchType] = useState('CODE128');
  const barcodeRef = useRef();
  const svgRef = useRef();
  const canvasRef = useRef();
  const fileInputRef = useRef();

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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvData = e.target.result;
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Check if CSV has the required columns
        if (!headers.includes('data') || !headers.includes('label')) {
          alert('CSV must contain "data" and "label" columns');
          return;
        }

        const items = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= 2) {
            items.push({
              id: i,
              data: values[headers.indexOf('data')],
              label: values[headers.indexOf('label')]
            });
          }
        }

        setBatchItems(items);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const generateBatchBarcode = async (item) => {
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const tempCanvas = document.createElement('canvas');
    
    try {
      if (batchType === 'QR') {
        await QRCode.toCanvas(tempCanvas, item.data, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        return tempCanvas.toDataURL();
      } else {
        let barcodeOptions = {
          format: batchType,
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 20,
          margin: 10
        };

        let data = item.data;
        if (batchType === 'UPC') {
          data = data.replace(/\D/g, '');
          if (data.length < 11) {
            data = data.padStart(11, '0');
          } else if (data.length > 11) {
            data = data.substring(0, 11);
          }
          data = data + calculateUPCCheckDigit(data);
        } else if (batchType === 'EAN13') {
          data = data.replace(/\D/g, '');
          if (data.length < 12) {
            data = data.padStart(12, '0');
          } else if (data.length > 12) {
            data = data.substring(0, 12);
          }
          data = data + calculateEAN13CheckDigit(data);
        }

        JsBarcode(tempSvg, data, barcodeOptions);
        const svgData = new XMLSerializer().serializeToString(tempSvg);
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        await new Promise(resolve => img.onload = resolve);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL();
      }
    } catch (error) {
      console.error('Error generating barcode:', error);
      return null;
    }
  };

  const downloadBatchBarcode = async (item) => {
    const barcodeData = await generateBatchBarcode(item);
    if (barcodeData) {
      const link = document.createElement('a');
      link.download = `${batchType === 'QR' ? 'qrcode' : 'barcode'}-${item.data}.png`;
      link.href = barcodeData;
      link.click();
    }
  };

  const downloadAllBatchBarcodes = async () => {
    for (const item of batchItems) {
      await downloadBatchBarcode(item);
      // Add a small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const removeBatchItem = (id) => {
    setBatchItems(batchItems.filter(item => item.id !== id));
  };

  return (
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

          <Paper elevation={1} sx={{ mb: 4, borderRadius: 1, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              centered
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Single Barcode" />
              <Tab label="Batch Generation" />
            </Tabs>

            {activeTab === 0 && (
              <Box sx={{ p: 4 }}>
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
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ p: 4 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Batch Code Type</InputLabel>
                      <Select
                        value={batchType}
                        label="Batch Code Type"
                        onChange={(e) => setBatchType(e.target.value)}
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                      />
                      <Button
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => fileInputRef.current.click()}
                        sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 500, px: 4, py: 1.5 }}
                      >
                        Upload CSV
                      </Button>
                    </Box>
                    <Box sx={{ 
                      mt: 2, 
                      mb: 3, 
                      p: 2, 
                      borderRadius: 1, 
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <Typography variant="subtitle1" color="primary" gutterBottom>
                        CSV File Instructions
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        1. Create a CSV file with two columns: "data" and "label"
                      </Typography>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        2. The "data" column should contain:
                        <ul style={{ marginTop: '4px', marginBottom: '8px', paddingLeft: '20px' }}>
                          <li>For UPC codes: 12 digits (e.g., 123456789012)</li>
                          <li>For EAN-13 codes: 13 digits (e.g., 1234567890123)</li>
                          <li>For QR codes: Any text or URL</li>
                          <li>For Code 128/39: Any alphanumeric text</li>
                        </ul>
                      </Typography>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        3. The "label" column should contain the text to display below each barcode
                      </Typography>

                      <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        bgcolor: 'rgba(255,255,255,0.05)', 
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        whiteSpace: 'pre'
                      }}>
                        data,label
                        {'\n'}123456789012,Product A - UPC
                        {'\n'}9876543210987,Product B - EAN13
                        {'\n'}https://example.com,Product C - QR
                        {'\n'}ABC123,Product D - Code128
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                        Note: Make sure to save your file with a .csv extension
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {batchItems.length > 0 && (
                  <>
                    <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 400 }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Data</TableCell>
                            <TableCell>Label</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {batchItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.data}</TableCell>
                              <TableCell>{item.label}</TableCell>
                              <TableCell align="right">
                                <Tooltip title="Download">
                                  <IconButton onClick={() => downloadBatchBarcode(item)}>
                                    <DownloadIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove">
                                  <IconButton onClick={() => removeBatchItem(item.id)}>
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={downloadAllBatchBarcodes}
                        startIcon={<DownloadIcon />}
                        sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 500, px: 4, py: 1.5 }}
                      >
                        Download All
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Paper>

          {activeTab === 0 && (
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
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default App;

# Retail Barcode Label Generator

A modern web application for generating retail barcode labels with customizable options.

## Features
- Generate various types of barcodes (Code 128, EAN-13, UPC, Code 39)
- Customize label text
- Download generated labels as PNG images
- Modern, responsive UI built with Material-UI
- Real-time barcode preview

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/dazdarren/barcode-maker.git
   cd barcode-maker/client
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm start
   ```
   The application will open in your default browser at [http://localhost:3000](http://localhost:3000).

## Usage
1. Enter the barcode data in the "Barcode Data" field
2. Select the desired barcode type from the dropdown
3. (Optional) Add custom label text
4. Click "Generate Barcode" to create the barcode
5. Click "Download Label" to save the barcode as a PNG image

## Supported Barcode Types
- Code 128: General purpose barcode format
- EAN-13: International retail product code
- UPC: Universal Product Code
- Code 39: Alphanumeric barcode format

## Technologies Used
- React
- Material-UI
- JsBarcode
- html2canvas

## License
This project is licensed under the MIT License. 
import { createTheme } from "@mui/material/styles";
import {blue, teal} from '@mui/material/colors'
export const  theme = createTheme({
    palette: {
      primary: {
        main: blue[500], // Main color
        light: blue[300], // Lighter shade
        dark: blue[700], // Darker shade
      },
      secondary: {
        main: teal[500],
        light: teal[300],
        dark: teal[700],
      },
      background: {
        default: '#f5f5f5', // Background color for the app
        paper: '#ffffff', // Background color for paper components
      },
      text: {
        primary: '#333333',
        secondary: '#666666',
      },
    },
  });
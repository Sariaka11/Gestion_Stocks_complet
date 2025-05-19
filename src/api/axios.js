import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api', // Change en fonction de ton backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;

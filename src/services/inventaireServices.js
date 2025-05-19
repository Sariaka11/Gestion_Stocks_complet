// services/inventaireServices.js

import axios from "../api/axios";

const API = "http://localhost:5000/api/Inventaires"; // adapte le port si besoin

export const getInventaires = () => axios.get(API);

export const createInventaire = (data) => axios.post(API, data);

export const deleteInventaire = (id) => axios.delete(`${API}/${id}`);

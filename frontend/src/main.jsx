import React from "react";
import axios from "axios";
import "./index.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
}
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

// Make API base URL available globally
window.API_BASE_URL = API_BASE_URL || "http://localhost:8000";

import ReactDOM from "react-dom/client";

import {
BrowserRouter
}
from "react-router-dom";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root"))
.render(

<BrowserRouter>

<App/>

</BrowserRouter>

);
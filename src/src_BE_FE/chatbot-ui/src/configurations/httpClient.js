import axios from "axios";
import { CONFIG } from "./endpoint";

const httpClient = axios.create({
   baseURL: CONFIG.API,
   timeout: 30000,
   headers: {
      "Content-Type": "application/json",
   },
});

export default httpClient;

import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";


dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 6001;
const MONGO_URL = process.env.MONGODB_URI;

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));


mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
  })
  .catch((error) => console.log(`${error} did not connect`));

// Helper function to generate unique IDs
const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Routes
app.get("/categories/:categoryname/products", async (req, res) => {
  try {
    const { categoryname } = req.params;
    const { n = 10, page = 1, sort = "price", order = "asc", minPrice, maxPrice, company } = req.query;

 
    const response = await axios.get(`http://20.244.56.144/test/companies/${company}/categories/${categoryname}/products`, {
      params: {
        top: n,
        minPrice,
        maxPrice
      }
    });

    let products = response.data;

    products = products.map(product => ({
      ...product,
      id: generateUniqueId()
    }));

   
    products.sort((a, b) => {
      if (order === "asc") return a[sort] - b[sort];
      return b[sort] - a[sort];
    });


    const startIndex = (page - 1) * n;
    const paginatedProducts = products.slice(startIndex, startIndex + n);

    res.json(paginatedProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/categories/:categoryname/products/:productid", async (req, res) => {
  try {
    const { categoryname, productid } = req.params;

   
    const response = await axios.get(`http://20.244.56.144/test/companies/categories/${categoryname}/products`);
    const products = response.data;

    const product = products.find(p => p.id === productid);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

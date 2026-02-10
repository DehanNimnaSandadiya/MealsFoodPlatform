import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { CartProvider } from "./lib/CartContext";

export default function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
}

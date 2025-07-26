import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import GlobalMessageDisplay from "./components/GlobalMessageDisplay.jsx";

const App = () => {
  return (
      <BrowserRouter>
        <GlobalMessageDisplay />
        <AppRoutes />
      </BrowserRouter>
  );
};

export default App;
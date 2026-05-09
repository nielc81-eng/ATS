import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { Candidate201FilesProvider } from "./context/Candidate201FilesContext";
import { DigitalFilesProvider } from "./context/DigitalFilesContext";
import { RecruitmentDataProvider } from "./context/RecruitmentDataContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RecruitmentDataProvider>
          <Candidate201FilesProvider>
            <DigitalFilesProvider>
              <App />
            </DigitalFilesProvider>
          </Candidate201FilesProvider>
        </RecruitmentDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

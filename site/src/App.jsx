import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";

const DocumentPage = lazy(() =>
  import("./pages/DocumentPage.jsx").then((module) => ({
    default: module.DocumentPage,
  })),
);
const FeaturesPage = lazy(() =>
  import("./pages/FeaturesPage.jsx").then((module) => ({
    default: module.FeaturesPage,
  })),
);
const PerformancePage = lazy(() =>
  import("./pages/PerformancePage.jsx").then((module) => ({
    default: module.PerformancePage,
  })),
);

export function App() {
  return (
    <Suspense
      fallback={
        <div
          className="fw-page-loading"
          role="status"
          aria-label="Loading page"
        />
      }
    >
      <Routes>
        <Route path="/" element={<PerformancePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/features.html" element={<FeaturesPage />} />
        <Route path="/about" element={<DocumentPage page="about" />} />
        <Route path="/about.html" element={<DocumentPage page="about" />} />
        <Route
          path="/methodology"
          element={<DocumentPage page="methodology" />}
        />
        <Route
          path="/methodology.html"
          element={<DocumentPage page="methodology" />}
        />
        <Route path="*" element={<DocumentPage page="missing" />} />
      </Routes>
    </Suspense>
  );
}
